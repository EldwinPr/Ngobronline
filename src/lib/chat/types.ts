export type MessageType = 'system' | 'signed_chat' | 'error' | 'delivered' | 'sent' | 'received';
export type VerificationStatus = 'pending' | 'verifying' | 'verified' | 'failed' | 'not_applicable';

export interface Message {
  type: MessageType;
  content: string;
  timestamp: string;
  from?: string;
  to?: string;
  verificationStatus?: VerificationStatus;
  signedMessage?: SignedMessage;
}

export interface WebSocketMessage {
  type: string;
  username?: string;
  to?: string;
  from?: string;
  content?: string;
  message?: any;
  timestamp?: number;
}

export interface SignedMessage {
  sender_username: string;
  receiver_username: string;
  plaintext_message: string;
  message_hash: string;
  signature: {
    r: string;
    s: string;
  };
  timestamp: string;
}