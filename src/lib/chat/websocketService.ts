import type { Message, SignedMessage, WebSocketMessage } from './types';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private connected = false;
  private username: string = '';
  private userIdentified = false;
  private connectionStatusCallback: (status: string) => void;
  private messageCallback: (message: Message) => void;
  
  constructor(
    connectionStatusCallback: (status: string) => void,
    messageCallback: (message: Message) => void
  ) {
    this.connectionStatusCallback = connectionStatusCallback;
    this.messageCallback = messageCallback;
  }
  
  // Connect to WebSocket server
  connect(username: string): void {
    if (!username) return;
    
    this.username = username;
    this.ws = new WebSocket('ws://localhost:3001');
    
    this.ws.onopen = () => {
      this.connected = true;
      this.connectionStatusCallback('Connected to server');
      this.identifyUser();
    };
    
    this.ws.onclose = () => {
      this.connected = false;
      this.userIdentified = false;
      this.connectionStatusCallback('Disconnected');
      
      // Attempt to reconnect after a delay
      setTimeout(() => this.connect(this.username), 3000);
    };
    
    this.ws.onerror = () => {
      this.connectionStatusCallback('Connection error');
    };
    
    this.ws.onmessage = this.handleMessage.bind(this);
  }
  
  // Handle incoming WebSocket message
  private handleMessage(event: MessageEvent): void {
    try {
      const data: WebSocketMessage = JSON.parse(event.data);
      
      // Handle different message types
      switch (data.type) {
        case 'system':
          if (data.message) {
            this.messageCallback({
              type: 'system',
              content: typeof data.message === 'string' ? data.message : JSON.stringify(data.message),
              timestamp: new Date().toLocaleTimeString()
            });
          }
          break;
          
        case 'signed_chat':
          try {
            // Extract the signed message
            let signedMsg: SignedMessage;
            
            if (typeof data.message === 'string') {
              signedMsg = JSON.parse(data.message);
            } else {
              signedMsg = data.message as SignedMessage;
            }
            
            // Add to messages
            this.messageCallback({
              type: 'received',
              from: signedMsg.sender_username,
              content: signedMsg.plaintext_message,
              timestamp: new Date(signedMsg.timestamp).toLocaleTimeString()
            });
            
          } catch (parseError) {
            console.error('Error processing signed message:', parseError);
          }
          break;
          
        case 'error':
          if (data.message) {
            this.messageCallback({
              type: 'error',
              content: typeof data.message === 'string' ? data.message : JSON.stringify(data.message),
              timestamp: new Date().toLocaleTimeString()
            });
          }
          break;
          
        case 'delivered':
          this.messageCallback({
            type: 'delivered',
            to: data.to,
            content: `Message delivered to ${data.to}`,
            timestamp: new Date().toLocaleTimeString()
          });
          break;
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }
  
  // Identify user to the server
  private identifyUser(): void {
    if (!this.connected || !this.username || !this.ws) return;
    
    this.ws.send(JSON.stringify({
      type: 'identify',
      username: this.username
    }));
    
    this.userIdentified = true;
  }
  
  // Send a signed message
  async sendSignedMessage(recipientUsername: string, messageText: string, signMessageFunction: Function): Promise<void> {
    if (!this.connected || !this.userIdentified || !messageText || !recipientUsername || !this.ws) {
      throw new Error('Cannot send message: not connected or missing data');
    }
    
    try {
      // Create signed message using the provided function
      const signedMessage = await signMessageFunction(
        this.username,
        recipientUsername,
        messageText
      );
      
      // Send via WebSocket
      this.ws.send(JSON.stringify({
        type: 'signed_chat',
        message: signedMessage
      }));
      
      // Add to local messages callback
      this.messageCallback({
        type: 'sent',
        to: recipientUsername,
        content: messageText,
        timestamp: new Date().toLocaleTimeString()
      });
      
      return;
    } catch (error) {
      console.error('Error sending signed message:', error);
      throw error;
    }
  }
  
  // Disconnect from server
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
      this.userIdentified = false;
    }
  }
  
  // Check if connected
  isConnected(): boolean {
    return this.connected && this.userIdentified;
  }
}