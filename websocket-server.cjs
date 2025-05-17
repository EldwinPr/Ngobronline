// websocket-server.cjs
const WebSocket = require('ws');
const http = require('http');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Check for DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
  console.error('Please ensure your .env file contains DATABASE_URL');
  process.exit(1);
}

// Initialize Prisma client
const prisma = new PrismaClient();

// Test database connection
prisma.$connect()
  .then(() => {
    console.log('Successfully connected to database');
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  });

const server = http.createServer();
const wss = new WebSocket.Server({ noServer: true });

// Simple in-memory user tracking
const connections = new Map();

// Handle WebSocket connection
wss.on('connection', (ws) => {
  let username = null;
  let userId = null;
  
  ws.on('message', async (messageData) => {
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
        
        // Lookup user ID from username
        try {
          const user = await prisma.user.findUnique({
            where: { username: username }
          });
          
          if (!user) {
            ws.send(JSON.stringify({
              type: 'error',
              message: `Invalid username: "${username}"`
            }));
            return;
          }
          
          userId = user.id;
          connections.set(username, ws);
          console.log(`User ${username} (${userId}) connected`);
          
          // Send confirmation
          ws.send(JSON.stringify({
            type: 'system',
            message: `Connected as ${username}`
          }));
          
          // Deliver any pending messages
          await deliverPendingMessages(username, userId, ws);
        } catch (error) {
          console.error(`Error identifying user ${username}:`, error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Internal server error during identification'
          }));
        }
        return;
      }
      
      // Handle signed message
      if (data.type === 'signed_chat' && username && userId && data.message) {
        try {
          // Extract message info
          const signedMessage = typeof data.message === 'string' 
            ? JSON.parse(data.message) 
            : data.message;
          
          const recipientUsername = signedMessage.receiver_username;
          
          // Find recipient's user ID
          const recipient = await prisma.user.findUnique({
            where: { username: recipientUsername }
          });
          
          if (!recipient) {
            ws.send(JSON.stringify({
              type: 'error',
              message: `User "${recipientUsername}" not found`
            }));
            return;
          }
          
          // Store message in database
          const storedMessage = await prisma.message.create({
            data: {
              senderId: userId,
              receiverId: recipient.id,
              plaintextContent: signedMessage.plaintext_message,
              messageHash: signedMessage.message_hash,
              signatureR: signedMessage.signature.r,
              signatureS: signedMessage.signature.s,
              status: 'PENDING' // Initial status
            }
          });
          
          console.log(`Stored message from ${username} to ${recipientUsername}`);
          
          // Add message ID to the signed message for client-side tracking
          signedMessage.id = storedMessage.id;
          
          // Check if recipient is online
          const recipientWs = connections.get(recipientUsername);
          
          if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
            // Forward message to recipient
            recipientWs.send(JSON.stringify({
              type: 'signed_chat',
              from: username,
              message: signedMessage
            }));
            
            // Update message status to DELIVERED
            await prisma.message.update({
              where: { id: storedMessage.id },
              data: { status: 'DELIVERED' }
            });
            
            // Send delivery confirmation to sender
            ws.send(JSON.stringify({
              type: 'delivered',
              to: recipientUsername,
              messageId: storedMessage.id,
              status: 'DELIVERED',
              content: `Message delivered to ${recipientUsername}`
            }));
            
            console.log(`Delivered message from ${username} to ${recipientUsername}`);
          } else {
            // Recipient is offline, message stays PENDING
            ws.send(JSON.stringify({
              type: 'pending',
              to: recipientUsername,
              messageId: storedMessage.id,
              status: 'PENDING',
              content: `User "${recipientUsername}" is not online. Message will be delivered when they connect.`
            }));
            
            console.log(`Message from ${username} to ${recipientUsername} stored as pending`);
          }
        } catch (error) {
          console.error('Error handling signed message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to process or deliver message'
          }));
        }
      }
      
      // Handle read receipt
      else if (data.type === 'read_receipt' && username && userId) {
        try {
          const { messageId, to } = data;
          
          if (!messageId || !to) {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Missing messageId or recipient in read receipt'
            }));
            return;
          }
          
          // Update message status in database
          await prisma.message.update({
            where: { id: messageId },
            data: { status: 'READ' }
          });
          
          console.log(`Message ${messageId} marked as read by ${username}`);
          
          // Forward read receipt to the original sender
          const senderWs = connections.get(to);
          if (senderWs && senderWs.readyState === WebSocket.OPEN) {
            senderWs.send(JSON.stringify({
              type: 'status_update',
              messageId,
              status: 'READ',
              from: username
            }));
            console.log(`Notified ${to} that message ${messageId} was read by ${username}`);
          }
        } catch (error) {
          console.error('Error handling read receipt:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Failed to process read receipt'
          }));
        }
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
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

// Function to deliver pending messages to a user when they connect
async function deliverPendingMessages(username, userId, ws) {
  try {
    // Find all pending messages for this user
    const pendingMessages = await prisma.message.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING'
      },
      include: {
        sender: {
          select: { username: true }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log(`Found ${pendingMessages.length} pending messages for ${username}`);
    
    // Deliver each pending message
    for (const msg of pendingMessages) {
      // Create signed message format
      const signedMessage = {
        id: msg.id,
        sender_username: msg.sender.username,
        receiver_username: username,
        plaintext_message: msg.plaintextContent,
        message_hash: msg.messageHash,
        signature: {
          r: msg.signatureR,
          s: msg.signatureS
        },
        timestamp: msg.createdAt.toISOString()
      };
      
      // Send to recipient
      ws.send(JSON.stringify({
        type: 'signed_chat',
        from: msg.sender.username,
        message: signedMessage
      }));
      
      // Update status to DELIVERED
      await prisma.message.update({
        where: { id: msg.id },
        data: { status: 'DELIVERED' }
      });
      
      console.log(`Delivered pending message from ${msg.sender.username} to ${username}`);
      
      // Optionally notify original sender if they're online
      const senderWs = connections.get(msg.sender.username);
      if (senderWs && senderWs.readyState === WebSocket.OPEN) {
        senderWs.send(JSON.stringify({
          type: 'status_update',
          messageId: msg.id,
          status: 'DELIVERED',
          to: username,
          content: `Message delivered to ${username}`
        }));
      }
    }
  } catch (error) {
    console.error(`Error delivering pending messages to ${username}:`, error);
  }
}

// Handle upgrade
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// Start the server
const PORT = process.env.WS_PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});