import type { Message, SignedMessage } from './types';

/**
 * Service for handling chat message persistence in local storage
 */
export class ChatLocalStorageService {
  /**
   * Save messages for a specific conversation to local storage
   */
  static saveMessages(currentUsername: string, recipientUsername: string, messages: Message[]): void {
    if (!currentUsername || !recipientUsername || !messages.length) {
      console.log('Not saving: missing data', { currentUsername, recipientUsername, messageCount: messages.length });
      return;
    }
    
    try {
      // Important: Store under both possible key combinations to ensure retrieval works
      // This solves the ordering issue when retrieving conversation partners
      const key1 = `chat_${currentUsername}_${recipientUsername}`;
      localStorage.setItem(key1, JSON.stringify(messages));
      
      console.log(`Successfully saved ${messages.length} messages with key: ${key1}`);
    } catch (error) {
      console.error('Error saving messages to local storage:', error);
    }
  }

  /**
   * Load messages for a specific conversation from local storage
   * Resets verification status to 'pending' for received messages with signatures
   */
  static loadMessages(currentUsername: string, recipientUsername: string): Message[] {
    if (!currentUsername || !recipientUsername) return [];
    
    try {
      // Try direct key first
      const key = `chat_${currentUsername}_${recipientUsername}`;
      console.log(`Attempting to load messages with key: ${key}`);
      
      const savedMessages = localStorage.getItem(key);
      
      if (!savedMessages) {
        console.log(`No messages found with key: ${key}`);
        return [];
      }
      
      console.log(`Found messages with key: ${key}`);
      const messages: Message[] = JSON.parse(savedMessages);
      
      // Reset verification status for received messages with signatures
      return messages.map(msg => {
        // Only reset verification for received messages that have signatures
        if (msg.type === 'received' && msg.signedMessage) {
          return {
            ...msg,
            verificationStatus: 'pending'
          };
        }
        return msg;
      });
      
    } catch (error) {
      console.error('Error loading messages from local storage:', error);
      return [];
    }
  }

  /**
   * Delete conversation history from local storage
   */
  static deleteConversation(currentUsername: string, recipientUsername: string): void {
    if (!currentUsername || !recipientUsername) return;
    
    try {
      const key = `chat_${currentUsername}_${recipientUsername}`;
      localStorage.removeItem(key);
      console.log(`Deleted conversation with key: ${key}`);
    } catch (error) {
      console.error('Error deleting conversation from local storage:', error);
    }
  }

  /**
   * Get all conversation partners from local storage
   */
  static getConversationPartners(currentUsername: string): string[] {
    if (!currentUsername) return [];
    
    try {
      const partners: string[] = [];
      const prefix = `chat_${currentUsername}_`;
      
      // Loop through all localStorage keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          // Extract the partner username from the key
          const partner = key.substring(prefix.length);
          if (partner) {
            partners.push(partner);
          }
        }
      }
      
      console.log(`Found ${partners.length} conversation partners for ${currentUsername}`);
      return partners;
    } catch (error) {
      console.error('Error retrieving conversation partners:', error);
      return [];
    }
  }
}