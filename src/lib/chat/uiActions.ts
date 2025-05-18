// src/lib/chat/uiActions.ts
import { get } from 'svelte/store';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { chatState } from './chatState';
import { saveCurrentConversation } from './chatHandlers';
import type { Message } from './types';

// UI state management
export function toggleContacts() {
  chatState.update(state => ({ ...state, showContacts: !state.showContacts }));
}

export function showVerificationDetails(message: Message & { id?: string }) {
  chatState.update(state => ({
    ...state,
    selectedMessage: message,
    showVerificationDetails: true
  }));
}

export function closeVerificationDetails() {
  chatState.update(state => ({
    ...state,
    showVerificationDetails: false,
    selectedMessage: null
  }));
}

export function toggleDebugInfo() {
  chatState.update(state => ({ ...state, showDebugInfo: !state.showDebugInfo }));
}

export function clearDebugLogs() {
  chatState.update(state => ({ ...state, debugMessages: [] }));
}

// Authentication
export function logout(): void {
  const state = get(chatState);
  
  if (browser) {
    // Save any current messages before logout
    if (state.username && state.recipientUsername && state.messages.length) {
      saveCurrentConversation();
    }
    
    localStorage.removeItem('username');
    localStorage.removeItem('user_id');
    goto('/login');
  }
}

// Input handling
export function updateMessageText(text: string) {
  chatState.update(state => ({ ...state, messageText: text }));
}