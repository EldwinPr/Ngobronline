// websocket-server.cjs
const { WebSocketServer } = require('ws');

// Create a standalone WebSocket server on port 3001
const wss = new WebSocketServer({ 
  port: 3001,
  // Add CORS headers in the upgrade handler
  handleProtocols: () => true,
  verifyClient: (info) => {
    // Allow all origins
    return true;
  }
});


wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Send a welcome message
  ws.send(JSON.stringify({ message: 'Hello from WebSocket server!' }));
  
  // Handle messages
  ws.on('message', (message) => {
    const messageStr = message.toString();
    console.log('Received:', messageStr);
    
    // Echo the message back
    try {
      ws.send(JSON.stringify({ 
        message: `Echo: ${messageStr}` 
      }));
      console.log('Sent echo response');
    } catch (error) {
      console.error('Error sending response:', error);
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log('WebSocket server running on port 3001');
