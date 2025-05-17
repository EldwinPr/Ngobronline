// src/lib/chat/localStorageService.ts

import type { Message, SignedMessage } from './types';

/**
 * Service for handling chat message persistence in local storage
 */
export class ChatLocalStorageService {
  /**
   * Save messages for a specific conversation to local storage
   */
  static saveMessages(currentUsername: string, recipientUsername: string, messages: Message[]): void {
    if (!currentUsername || !recipientUsername || !messages.length) return;
    
    const conversationKey = this.getConversationKey(currentUsername, recipientUsername);
    try {
      localStorage.setItem(conversationKey, JSON.stringify(messages));
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
    
    const conversationKey = this.getConversationKey(currentUsername, recipientUsername);
    try {
      const savedMessages = localStorage.getItem(conversationKey);
      
      if (!savedMessages) return [];
      
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
    
    const conversationKey = this.getConversationKey(currentUsername, recipientUsername);
    try {
      localStorage.removeItem(conversationKey);
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
      
      return partners;
    } catch (error) {
      console.error('Error retrieving conversation partners:', error);
      return [];
    }
  }

  /**
   * Generate a consistent key for storing conversation messages
   */
  private static getConversationKey(currentUsername: string, recipientUsername: string): string {
    // Sort usernames to ensure the same key regardless of who initiated the conversation
    const users = [currentUsername, recipientUsername].sort();
    return `chat_${users[0]}_${users[1]}`;
  }
}