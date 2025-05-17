// websocket-server.cjs
const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ noServer: true });

// Simple in-memory user tracking
const connections = new Map();

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
            content: 'Message delivered'
          }));
        } else {
          // Recipient not online
          ws.send(JSON.stringify({
            type: 'error',
            message: `User "${recipientUsername}" is not online`
          }));
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

server.listen(3001, () => {
  console.log('WebSocket server running on port 3001');
});