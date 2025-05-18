// src/lib/chat/chatInitialization.ts
import { get } from 'svelte/store';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { chatState } from './chatState';
import { saveCurrentConversation, handleConnectionStatus, handleNewMessage, handleVerificationUpdate, loadConversation } from './chatHandlers';
import { WebSocketService } from './websocketService';

// Initialize user and WebSocket connection
export function initializeChat(): WebSocketService | null {
  if (!browser) return null;

  const storedUsername = localStorage.getItem('username');
  if (!storedUsername) {
    goto('/login');
    return null;
  }

  // Update state with username
  chatState.update(state => ({
    ...state,
    username: storedUsername,
    loadingUsername: false
  }));

  // Initialize WebSocket service
  const websocketService = new WebSocketService(
    handleConnectionStatus,
    handleNewMessage,
    handleVerificationUpdate
  );

  // Connect to WebSocket server
  websocketService.connect(storedUsername);

  return websocketService;
}

// Setup beforeunload handler
export function setupBeforeUnload() {
  if (!browser) return;

  const handleBeforeUnload = () => {
    const state = get(chatState);
    if (state.username && state.recipientUsername && state.messages.length) {
      saveCurrentConversation();
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  // Return cleanup function
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}

// Cleanup function
export function cleanupChat(websocketService: WebSocketService | null) {
  const state = get(chatState);
  
  // Save current conversation before cleanup
  if (browser && state.username && state.recipientUsername && state.messages.length) {
    saveCurrentConversation();
  }

  if (websocketService) {
    websocketService.disconnect();
  }
}