// websocket-server.cjs
const WebSocket = require('ws');
const http = require('http');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Prisma client with the DATABASE_URL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    },
  },
});

// Test database connection on startup
async function testDbConnection() {
  try {
    // Try a simple query
    const userCount = await prisma.user.count();
    console.log(`Connected to database. User count: ${userCount}`);
    return true;
  } catch (error) {
    console.error('Failed to connect to database:', error);
    return false;
  }
}

// Call the test function
testDbConnection()
  .then(connected => {
    if (!connected) {
      console.error('Exiting due to database connection failure');
      process.exit(1);
    }
  });

const server = http.createServer();
const wss = new WebSocket.Server({ noServer: true });

// Simple in-memory user tracking
const connections = new Map();

// Store offline message in the database
async function storeOfflineMessage(senderUsername, recipientUsername, signedMessage) {
  try {
    console.log(`Storing offline message from ${senderUsername} to ${recipientUsername}`);
    console.log('Original signed message:', JSON.stringify(signedMessage, null, 2));
    
    // Get sender and recipient IDs
    const sender = await prisma.user.findUnique({
      where: { username: senderUsername },
      select: { id: true }
    });
    
    const recipient = await prisma.user.findUnique({
      where: { username: recipientUsername },
      select: { id: true }
    });
    
    if (!sender || !recipient) {
      console.error(`Sender or recipient not found: ${!sender ? 'sender' : 'recipient'} missing`);
      throw new Error('Sender or recipient not found');
    }
    
    const savedMessage = await prisma.message.create({
      data: {
        senderId: sender.id,
        receiverId: recipient.id,
        plaintextContent: signedMessage.plaintext_message,
        messageHash: signedMessage.message_hash,
        signatureR: signedMessage.signature.r,
        signatureS: signedMessage.signature.s,
        status: 'PENDING'
      }
    });
    
    console.log(`Successfully stored offline message with ID: ${savedMessage.id}`);
    return savedMessage;
  } catch (error) {
    console.error('Error storing offline message:', error);
    throw error;
  }
}

// Deliver pending messages when a user connects
async function deliverPendingMessages(username, socket) {
  try {
    console.log(`Checking for pending messages for ${username}`);
    
    // Get user ID
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true }
    });
    
    if (!user) {
      console.error(`User ${username} not found in database`);
      throw new Error('User not found');
    }
    
    // Get pending messages
    const pendingMessages = await prisma.message.findMany({
      where: {
        receiverId: user.id,
        status: 'PENDING'
      },
      include: {
        sender: {
          select: {
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log(`Found ${pendingMessages.length} pending messages for ${username}`);
    
    // Send each message
    for (const message of pendingMessages) {
      // Reconstruct signed message format
      const signedMessage = {
        sender_username: message.sender.username,
        receiver_username: username,
        plaintext_message: message.plaintextContent,
        message_hash: message.messageHash, 
        signature: {
          r: message.signatureR,         
          s: message.signatureS               
        },
        timestamp: message.createdAt.toISOString()
      };

      console.log('Reconstructed message:', JSON.stringify(signedMessage, null, 2));
      
      // Send to user
      socket.send(JSON.stringify({
        type: 'signed_chat',
        from: message.sender.username,
        message: signedMessage
      }));
      
      // Update message status to DELIVERED
      await prisma.message.update({
        where: { id: message.id },
        data: { status: 'DELIVERED' }
      });
      
      console.log(`Delivered offline message ${message.id} to ${username}`);
    }
    
    // If messages were delivered, send a summary notification
    if (pendingMessages.length > 0) {
      socket.send(JSON.stringify({
        type: 'system',
        message: `Delivered ${pendingMessages.length} message(s) that arrived while you were offline`
      }));
    }
  } catch (error) {
    console.error(`Error delivering pending messages to ${username}:`, error);
    socket.send(JSON.stringify({
      type: 'error',
      message: 'Failed to retrieve offline messages'
    }));
  }
}

// Handle WebSocket connection
wss.on('connection', (ws) => {
  let username = null;
  
  ws.on('message', (messageData) => {
    try {
      const message = messageData.toString();
      const data = JSON.parse(message);
      
      // Handle user identification
      if (data.type === 'identify' && data.username) {
        username = data.username;
        
        // Check if username is already in use
        if (connections.has(username)) {
          ws.send(JSON.stringify({
            type: 'error',
            message: `Username "${username}" is already in use`
          }));
          return;
        }
        
        connections.set(username, ws);
        console.log(`User ${username} connected`);
        
        // Send confirmation
        ws.send(JSON.stringify({
          type: 'system',
          message: `Connected as ${username}`
        }));
        
        // Deliver any pending messages
        deliverPendingMessages(username, ws)
          .catch(error => {
            console.error(`Error in deliverPendingMessages:`, error);
          });
        
        return;
      }
      
      // Handle signed message
      if (data.type === 'signed_chat' && username && data.message) {
        // Extract message info
        const signedMessage = typeof data.message === 'string' 
          ? JSON.parse(data.message) 
          : data.message;
        
        const recipientUsername = signedMessage.receiver_username;
        const recipientWs = connections.get(recipientUsername);
        
        console.log(`Signed message from ${username} to ${recipientUsername}`);
        
        // Forward to recipient if online
        if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
          recipientWs.send(JSON.stringify({
            type: 'signed_chat',
            from: username,
            message: signedMessage
          }));
          
          // Send delivery confirmation to sender
          ws.send(JSON.stringify({
            type: 'delivered',
            to: recipientUsername,
            content: `Message delivered to ${recipientUsername}`
          }));
        } else {
          // Recipient not online - store in database
          storeOfflineMessage(username, recipientUsername, signedMessage)
            .then(() => {
              // Inform sender that message is saved for later delivery
              ws.send(JSON.stringify({
                type: 'saved',
                to: recipientUsername,
                content: `User "${recipientUsername}" is not online. Message saved for later delivery.`
              }));
            })
            .catch(error => {
              console.error('Error storing message:', error);
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to save message for offline delivery'
              }));
            });
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    if (username) {
      connections.delete(username);
      console.log(`User ${username} disconnected`);
    }
  });
});

// Handle upgrade
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

const PORT = process.env.WS_PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});