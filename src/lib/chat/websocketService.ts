import type { Message, SignedMessage, WebSocketMessage, VerificationStatus } from './types';
import { verifySignedMessage, clearPublicKeyCache } from './verifyMessage';

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
    
    // Use localhost for development
    let wsUrl = '';
    
    // Check if we're in a development environment
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      wsUrl = 'ws://localhost:3001';
      console.log('Using development WebSocket URL:', wsUrl);
    } else if (typeof window !== 'undefined' && window.location.host.includes('vercel.app')) {
      // Production deployment on Vercel
      wsUrl = 'wss://ngobronline-production.up.railway.app';
      console.log('Using production WebSocket URL:', wsUrl);
    } else {
      // Default fallback
      wsUrl = 'ws://localhost:3001';
      console.log('Using default WebSocket URL:', wsUrl);
    }
    
    console.log('Connecting to WebSocket server at:', wsUrl);
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        this.connected = true;
        this.connectionStatusCallback('Connected to server');
        
        // Clear cached public keys on connection to ensure fresh data
        clearPublicKeyCache();
        console.log('Cleared public key cache on connect');
        
        this.identifyUser();
      };
      
      this.ws.onclose = () => {
        this.connected = false;
        this.userIdentified = false;
        this.connectionStatusCallback('Disconnected');
        
        // Attempt to reconnect after a delay
        setTimeout(() => this.connect(this.username), 3000);
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connectionStatusCallback('Connection error');
      };
      
      this.ws.onmessage = this.handleMessage.bind(this);
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.connectionStatusCallback('Failed to connect');
    }
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
            
            // Clear the public key cache for the sender to ensure fresh verification
            clearPublicKeyCache(signedMsg.sender_username);
            
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
            
            // Begin verification process with fresh public key
            this.verifyMessage(messageId, signedMsg, true);
            
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
  private async verifyMessage(messageId: string, signedMessage: SignedMessage, forceRefresh = false): Promise<void> {
    try {
      // Update status to verifying
      this.verificationUpdateCallback(messageId, 'verifying');
      
      console.log(`Starting verification for message ${messageId} with forceRefresh=${forceRefresh}`);
      
      // Perform the actual verification - passing forceRefresh flag
      const isValid = await verifySignedMessage(signedMessage, forceRefresh);
      
      // Update the status based on the result
      const status: VerificationStatus = isValid ? 'verified' : 'failed';
      console.log(`Message ${messageId} verification result: ${status}`);
      
      this.verificationUpdateCallback(messageId, status, isValid);
      
    } catch (error) {
      console.error(`Message ${messageId} verification error:`, error);
      this.verificationUpdateCallback(messageId, 'failed', false);
    }
  }
  
  /**
   * Public method to manually reverify a message
   */
  public reverifyMessage(messageId: string, signedMessage: SignedMessage): void {
    // Clear any cached public key for this sender
    clearPublicKeyCache(signedMessage.sender_username);
    console.log(`Reverifying message ${messageId} from ${signedMessage.sender_username}`);
    
    // Force refresh public key for verification
    this.verifyMessage(messageId, signedMessage, true);
  }
  
  /**
   * Send a signed message
   */
  async sendSignedMessage(recipientUsername: string, messageText: string, signMessageFunction: Function): Promise<void> {
    if (!this.connected || !this.userIdentified || !messageText || !recipientUsername || !this.ws) {
      throw new Error('Cannot send message: not connected or missing data');
    }
    
    try {
      console.log(`Creating signed message from ${this.username} to ${recipientUsername}`);
      
      // Create signed message using the provided function
      const signedMessage = await signMessageFunction(
        this.username,
        recipientUsername,
        messageText
      );
      
      console.log('Signed message created with hash:', signedMessage.message_hash.substring(0, 10) + '...');
      
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

  public verifyLoadedMessage(messageId: string, signedMessage: SignedMessage): void {
    // Clear cached public key for this sender
    clearPublicKeyCache(signedMessage.sender_username);
    
    // Try to use the connection if available
    if (this.connected && this.userIdentified) {
      console.log(`Verifying loaded message ${messageId} from ${signedMessage.sender_username}`);
      this.verifyMessage(messageId, signedMessage, true);
      return;
    }
    
    // Otherwise, perform offline verification
    this.performOfflineVerification(messageId, signedMessage);
  }

  /**
   * Perform verification without an active WebSocket connection
   */
  private async performOfflineVerification(messageId: string, signedMessage: SignedMessage): Promise<void> {
    try {
      // Update status to verifying
      this.verificationUpdateCallback(messageId, 'verifying');
      
      console.log(`Performing offline verification for message ${messageId}`);
      
      // Import the verification function
      const { verifySignedMessage } = await import('./verifyMessage');
      
      // Perform the verification with forced refresh
      const isValid = await verifySignedMessage(signedMessage, true);
      
      // Update status based on the result
      const status: VerificationStatus = isValid ? 'verified' : 'failed';
      console.log(`Offline verification result for ${messageId}: ${status}`);
      
      this.verificationUpdateCallback(messageId, status, isValid);
      
    } catch (error) {
      console.error('Offline verification error:', error);
      this.verificationUpdateCallback(messageId, 'failed', false);
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