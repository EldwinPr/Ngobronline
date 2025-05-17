<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { createSignedMessage } from '$lib/messageSigningFunctions';
  import { WebSocketService } from '$lib/chat/websocketService';
  import type { Message } from '$lib/chat/types';
  
  // State variables
  let websocketService: WebSocketService | null = null;
  let username = '';
  let recipientUsername = '';
  let messageText = '';
  let messages: Message[] = [];
  let connectionStatus = 'Disconnected';
  let loadingUsername = true;
  
  // Handle connection status changes
  function handleConnectionStatus(status: string) {
    connectionStatus = status;
  }
  
  // Handle new messages
  function handleNewMessage(message: Message) {
    messages = [...messages, message];
  }
  
  // Send a signed message
  async function sendSignedMessage(): Promise<void> {
    if (!websocketService || !messageText || !recipientUsername) return;
    
    try {
      await websocketService.sendSignedMessage(recipientUsername, messageText, createSignedMessage);
      
      // Clear input after successful send
      messageText = '';
    } catch (error) {
      console.error('Error sending signed message:', error);
      messages = [...messages, {
        type: 'error',
        content: `Failed to send message: ${
          typeof error === 'object' && error !== null && 'message' in error
            ? (error as { message: string }).message
            : String(error)
        }`,
        timestamp: new Date().toLocaleTimeString()
      }];
    }
  }
  
  // Handle Enter key in message input
  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendSignedMessage();
    }
  }
  
  // Logout function
  function logout(): void {
    if (browser) {
      localStorage.removeItem('username');
      goto('/login');
    }
  }
  
  // Setup on component mount
  onMount(() => {
    if (browser) {
      const storedUsername = localStorage.getItem('username');
      if (!storedUsername) {
        goto('/login');
        return;
      }
      
      username = storedUsername;
      loadingUsername = false;
      
      // Initialize WebSocket service
      websocketService = new WebSocketService(
        handleConnectionStatus,
        handleNewMessage
      );
      
      // Connect to WebSocket server
      websocketService.connect(username);
    }
  });
  
  // Clean up on component destroy
  onDestroy(() => {
    if (websocketService) {
      websocketService.disconnect();
    }
  });
</script>

<div class="chat-container">
  <header>
    <h1>Secure Chat</h1>
    <div class="status-bar">
      <span>Status: {connectionStatus}</span>
    </div>
  </header>
  
  {#if loadingUsername}
    <div class="loading">Loading user information...</div>
  {:else if !username}
    <div class="error-message">
      <p>Not logged in. Redirecting to login page...</p>
    </div>
  {:else}
    <div class="chat-app">
      <div class="user-header">
        <span>Connected as: <strong>{username}</strong></span>
        <button class="logout-btn" on:click={logout}>Logout</button>
      </div>
      
      <div class="recipient-input">
        <input 
          type="text" 
          bind:value={recipientUsername} 
          placeholder="Recipient username"
        />
      </div>
      
      <div class="message-container">
        {#each messages as msg}
          <div class="message-item {msg.type}">
            {#if msg.type === 'system'}
              <div class="system-message">
                [{msg.timestamp}] SYSTEM: {msg.content}
              </div>
            {:else if msg.type === 'error'}
              <div class="error-message">
                [{msg.timestamp}] ERROR: {msg.content}
              </div>
            {:else if msg.type === 'sent'}
              <div class="sent-message">
                [{msg.timestamp}] TO {msg.to}: {msg.content}
              </div>
            {:else if msg.type === 'received'}
              <div class="received-message">
                [{msg.timestamp}] FROM {msg.from}: {msg.content}
              </div>
            {:else if msg.type === 'delivered'}
              <div class="delivered-message">
                [{msg.timestamp}] {msg.content}
              </div>
            {/if}
          </div>
        {/each}
      </div>
      
      <div class="input-area">
        <textarea 
          bind:value={messageText} 
          placeholder="Type your message..." 
          on:keydown={handleKeydown}
          rows="3"
        ></textarea>
        <button 
          class="send-button" 
          on:click={sendSignedMessage} 
          disabled={!messageText || !recipientUsername}
        >
          Send Message
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .chat-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  
  header {
    margin-bottom: 20px;
  }
  
  h1 {
    margin: 0 0 10px 0;
  }
  
  .status-bar {
    color: #666;
    font-size: 14px;
  }
  
  .user-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }
  
  .logout-btn {
    padding: 5px 10px;
    background-color: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .recipient-input input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 15px;
  }
  
  .message-container {
    border: 1px solid #eee;
    border-radius: 4px;
    height: 300px;
    overflow-y: auto;
    padding: 10px;
    margin-bottom: 15px;
    background-color: #f9f9f9;
  }
  
  .message-item {
    margin-bottom: 8px;
    padding: 4px 0;
  }
  
  .system-message {
    color: #666;
  }
  
  .error-message {
    color: #d32f2f;
  }
  
  .sent-message {
    color: #1976d2;
  }
  
  .received-message {
    color: #2e7d32;
  }
  
  .delivered-message {
    color: #ed6c02;
    font-style: italic;
  }
  
  .input-area {
    display: flex;
    flex-direction: column;
  }
  
  textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 10px;
    resize: vertical;
  }
  
  .send-button {
    padding: 10px;
    background-color: #1976d2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  }
  
  .send-button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
  
  .loading {
    text-align: center;
    padding: 20px;
    color: #666;
  }
</style>