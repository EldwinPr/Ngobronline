// src/lib/chat/chatState.ts
import { writable } from 'svelte/store';
import type { Message, VerificationStatus } from './types';

export interface ChatState {
  username: string;
  recipientUsername: string;
  messageText: string;
  messages: (Message & { id?: string })[];
  connectionStatus: string;
  loadingUsername: boolean;
  selectedMessage: (Message & { id?: string }) | null;
  showVerificationDetails: boolean;
  autoSaveEnabled: boolean;
  showContacts: boolean;
  showDebugInfo: boolean;
  debugMessages: Array<{direction: string, data: any, timestamp: string}>;
}

export const initialChatState: ChatState = {
  username: '',
  recipientUsername: '',
  messageText: '',
  messages: [],
  connectionStatus: 'Disconnected',
  loadingUsername: true,
  selectedMessage: null,
  showVerificationDetails: false,
  autoSaveEnabled: true,
  showContacts: true,
  showDebugInfo: false,
  debugMessages: []
};

export const chatState = writable<ChatState>(initialChatState);