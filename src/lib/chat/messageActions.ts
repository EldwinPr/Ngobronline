// src/lib/chat/messageActions.ts
import { get } from 'svelte/store';
import { browser } from '$app/environment';
import { chatState } from './chatState';
import { saveCurrentConversation } from './chatHandlers';
import { createSignedMessage } from './messageSigningFunctions';
import { WebSocketService } from './websocketService';
import type { Message } from './types';

// Send a signed message
export async function sendSignedMessage(websocketService: WebSocketService | null): Promise<void> {
  const state = get(chatState);
  
  if (!websocketService || !state.messageText || !state.recipientUsername) return;
  
  try {
    // Create the signed message first
    const signedMessage = await createSignedMessage(
      state.username,
      state.recipientUsername,
      state.messageText
    );
    
    // Add to debug log
    chatState.update(state => ({
      ...state,
      debugMessages: [...state.debugMessages, {
        direction: 'SENT',
        data: signedMessage,
        timestamp: new Date().toISOString()
      }]
    }));
    
    // Send using the service
    await websocketService.sendSignedMessage(state.recipientUsername, state.messageText, createSignedMessage);
    
    // Clear input after successful send
    chatState.update(state => ({ ...state, messageText: '' }));
    
    // Manual save after sending
    if (browser && state.username && state.recipientUsername) {
      setTimeout(() => saveCurrentConversation(), 100);
    }
  } catch (error) {
    console.error('Error sending signed message:', error);
    
    const errorMessage: Message = {
      type: 'error',
      content: `Failed to send message: ${
        typeof error === 'object' && error !== null && 'message' in error
          ? (error as { message: string }).message
          : String(error)
      }`,
      timestamp: new Date().toLocaleTimeString()
    };

    chatState.update(state => ({
      ...state,
      messages: [...state.messages, errorMessage]
    }));

    // Save after adding error message
    saveCurrentConversation();
  }
}

// Handle Enter key in message input
export function handleKeydown(event: KeyboardEvent, websocketService: WebSocketService | null): void {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendSignedMessage(websocketService);
  }
}

// Manually reverify a message
export function reverifyMessage(websocketService: WebSocketService | null, message: Message & { id?: string }) {
  if (!websocketService || !message.id || !message.signedMessage) return;
  websocketService.reverifyMessage(message.id, message.signedMessage);
}