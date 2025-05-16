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
      
      // Handle chat message
      if (data.type === 'chat' && username && data.to && data.content) {
        const recipientUsername = data.to;
        const recipientWs = connections.get(recipientUsername);
        
        console.log(`Message from ${username} to ${recipientUsername}: ${data.content}`);
        
        // Forward to recipient if online
        if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
          recipientWs.send(JSON.stringify({
            type: 'chat',
            from: username,
            content: data.content,
            timestamp: Date.now()
          }));
          
          // Send delivery confirmation to sender
          ws.send(JSON.stringify({
            type: 'delivered',
            to: recipientUsername,
            content: data.content
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
