// src/lib/chat/chatHandlers.ts
import { get } from 'svelte/store';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { chatState } from './chatState';
import { WebSocketService } from './websocketService';
import { ChatLocalStorageService } from './localStorageService';
import { createSignedMessage } from './messageSigningFunctions';
import type { Message, VerificationStatus } from './types';

// WebSocket connection handlers
export function handleConnectionStatus(status: string) {
  chatState.update(state => ({ ...state, connectionStatus: status }));
}

export function handleNewMessage(message: Message & { id?: string }) {
  chatState.update(state => {
    // Add to debug log if received message with signature
    let newDebugMessages = state.debugMessages;
    if (message.type === 'received' && message.signedMessage) {
      newDebugMessages = [...state.debugMessages, {
        direction: 'RECEIVED',
        data: message.signedMessage,
        timestamp: new Date().toISOString()
      }];
    }

    const newMessages = [...state.messages, message];
    
    // Auto-save if enabled
    if (state.autoSaveEnabled && browser && state.username && state.recipientUsername) {
      saveCurrentConversation(state.username, state.recipientUsername, newMessages);
    }

    return {
      ...state,
      messages: newMessages,
      debugMessages: newDebugMessages
    };
  });
}

export function handleVerificationUpdate(messageId: string, status: VerificationStatus, isValid?: boolean) {
  chatState.update(state => {
    const updatedMessages = state.messages.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, verificationStatus: status };
      }
      return msg;
    });

    // Auto-save after verification updates
    if (state.autoSaveEnabled && browser && state.username && state.recipientUsername) {
      saveCurrentConversation(state.username, state.recipientUsername, updatedMessages);
    }

    return { ...state, messages: updatedMessages };
  });
}

// Conversation management
export function saveCurrentConversation(username?: string, recipientUsername?: string, messages?: (Message & { id?: string })[]) {
  const state = get(chatState);
  const user = username || state.username;
  const recipient = recipientUsername || state.recipientUsername;
  const msgs = messages || state.messages;
  
  if (!browser || !user || !recipient || !msgs.length) {
    return;
  }
  
  ChatLocalStorageService.saveMessages(user, recipient, msgs);
}

export function loadConversation(websocketService: WebSocketService | null, recipient: string) {
  const state = get(chatState);
  
  if (!browser || !state.username || !recipient) {
    return [];
  }
  
  // Save current conversation first if applicable
  if (state.recipientUsername && state.messages.length) {
    saveCurrentConversation();
  }
  
  // Load messages for this recipient
  const loadedMessages = ChatLocalStorageService.loadMessages(state.username, recipient);
  
  // Update state
  chatState.update(state => ({
    ...state,
    recipientUsername: recipient,
    messages: loadedMessages,
    showContacts: window.innerWidth < 768 ? false : state.showContacts
  }));
  
  // Re-verify all loaded messages
  verifyLoadedMessages(websocketService, loadedMessages);
  
  return loadedMessages;
}

export function verifyLoadedMessages(websocketService: WebSocketService | null, loadedMessages: (Message & { id?: string })[]) {
  if (!websocketService) return;
  
  // Temporarily disable auto-save
  chatState.update(state => ({ ...state, autoSaveEnabled: false }));
  
  // Add IDs to messages that don't have them
  loadedMessages.forEach(msg => {
    if (msg.type === 'received' && msg.signedMessage) {
      if (!msg.id) {
        msg.id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      }
      
      if (msg.id && websocketService) {
        websocketService.verifyLoadedMessage(msg.id, msg.signedMessage);
      }
    }
  });
  
  // Re-enable auto-save after delay
  setTimeout(() => {
    chatState.update(state => ({ ...state, autoSaveEnabled: true }));
    saveCurrentConversation();
  }, 500);
}