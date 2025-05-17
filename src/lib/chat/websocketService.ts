import type { Message, SignedMessage, WebSocketMessage, VerificationStatus } from './types';
import { verifySignedMessage } from './verifyMessage';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private connected = false;
  private username: string = '';
  private userIdentified = false;
  private connectionStatusCallback: (status: string) => void;
  private messageCallback: (message: Message & { id?: string }) => void;
  private verificationUpdateCallback: (messageId: string, status: VerificationStatus, isValid?: boolean) => void;
  
  constructor(
    connectionStatusCallback: (status: string) => void,
    messageCallback: (message: Message & { id?: string }) => void,
    verificationUpdateCallback: (messageId: string, status: VerificationStatus, isValid?: boolean) => void
  ) {
    this.connectionStatusCallback = connectionStatusCallback;
    this.messageCallback = messageCallback;
    this.verificationUpdateCallback = verificationUpdateCallback;
  }
  
connect(username: string): void {
  if (!username) return;
  
  this.username = username;
  
  // Debug logging
  console.log('Environment:', import.meta.env.PROD ? 'Production' : 'Development');
  console.log('WebSocket URL env variable:', import.meta.env.VITE_WEBSOCKET_URL);
  
  // Determine WebSocket URL
  let wsUrl = 'ws://wss://ngobronline-production.up.railway.app';
  if (typeof window !== 'undefined' && window.location.host.includes('vercel.app')) {
    wsUrl = `wss://ngobronline-production.up.railway.app`;
    console.log('Using production WebSocket URL:', wsUrl);
  }
  
  console.log('Connecting to WebSocket server at:', wsUrl);
  this.ws = new WebSocket(wsUrl);
    
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
  
  /**
   * Identify user to the server
   */
  private identifyUser(): void {
    if (!this.connected || !this.username || !this.ws) return;
    
    this.ws.send(JSON.stringify({
      type: 'identify',
      username: this.username
    }));
    
    this.userIdentified = true;
  }
  
  /**
   * Handle incoming WebSocket messages
   */
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
            
            // Generate a unique ID for this message
            const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            
            // Add to messages with pending verification status
            this.messageCallback({
              type: 'received',
              from: signedMsg.sender_username,
              content: signedMsg.plaintext_message,
              timestamp: new Date(signedMsg.timestamp).toLocaleTimeString(),
              verificationStatus: 'pending',
              signedMessage: signedMsg,
              id: messageId
            });
            
            // Begin verification process
            this.verifyMessage(messageId, signedMsg);
            
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
          
        default:
          console.log(`Unknown message type: ${data.type}`);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }
  
  /**
   * Verify a message and update its status
   */
  private async verifyMessage(messageId: string, signedMessage: SignedMessage): Promise<void> {
    try {
      // Update status to verifying
      this.verificationUpdateCallback(messageId, 'verifying');
      
      // Perform the actual verification
      const isValid = await verifySignedMessage(signedMessage);
      
      // Update the status based on the result
      const status: VerificationStatus = isValid ? 'verified' : 'failed';
      this.verificationUpdateCallback(messageId, status, isValid);
      
    } catch (error) {
      console.error('Message verification error:', error);
      this.verificationUpdateCallback(messageId, 'failed', false);
    }
  }
  
  /**
   * Public method to manually reverify a message
   */
  public reverifyMessage(messageId: string, signedMessage: SignedMessage): void {
    this.verifyMessage(messageId, signedMessage);
  }
  
  /**
   * Send a signed message
   */
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
  
  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
      this.userIdentified = false;
    }
  }
  
  /**
   * Check if connected and identified
   */
  isConnected(): boolean {
    return this.connected && this.userIdentified;
  }
}