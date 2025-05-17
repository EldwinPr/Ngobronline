<!-- routes/chat/+page.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { createSignedMessage } from '$lib/chat/messageSigningFunctions';
  import { WebSocketService } from '$lib/chat/websocketService';
  import type { Message, SignedMessage, VerificationStatus } from '$lib/chat/types';
  
  // State variables
  let websocketService: WebSocketService | null = null;
  let username = '';
  let recipientUsername = '';
  let messageText = '';
  let messages: (Message & { id?: string })[] = [];
  let connectionStatus = 'Disconnected';
  let loadingUsername = true;
  let selectedMessage: (Message & { id?: string }) | null = null;
  let showVerificationDetails = false;
  
  // Handle connection status changes
  function handleConnectionStatus(status: string) {
    connectionStatus = status;
  }
  
  // Handle new messages
  function handleNewMessage(message: Message & { id?: string }) {
    messages = [...messages, message];
  }
  
  // Handle verification status updates
  function handleVerificationUpdate(messageId: string, status: VerificationStatus, isValid?: boolean) {
    messages = messages.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, verificationStatus: status };
      }
      return msg;
    });
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
  
  // Manually reverify a message
  function reverifyMessage(message: Message & { id?: string }) {
    if (!websocketService || !message.id || !message.signedMessage) return;
    
    websocketService.reverifyMessage(message.id, message.signedMessage);
  }
  
  // Show verification details for a message
  function showDetails(message: Message & { id?: string }) {
    selectedMessage = message;
    showVerificationDetails = true;
  }
  
  // Close verification details modal
  function closeDetails() {
    showVerificationDetails = false;
    selectedMessage = null;
  }
  
  // Format JSON for display
  function formatJSON(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }
  
  // Get verification status icon
  function getVerificationIcon(status?: VerificationStatus): string {
    switch (status) {
      case 'verified': return '✓';
      case 'failed': return '✗';
      case 'verifying': return '⟳';
      case 'pending': return '⧖';
      default: return '';
    }
  }
  
  // Get verification status color
  function getVerificationColor(status?: VerificationStatus): string {
    switch (status) {
      case 'verified': return 'green';
      case 'failed': return 'red';
      case 'verifying': return 'blue';
      case 'pending': return 'gray';
      default: return 'inherit';
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
        handleNewMessage,
        handleVerificationUpdate
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
                <div class="message-header">
                  <span>[{msg.timestamp}] FROM {msg.from}:</span>
                  
                  {#if msg.verificationStatus}
                    <span 
                      class="verification-status"
                      style="color: {getVerificationColor(msg.verificationStatus)};"
                      title="Verification: {msg.verificationStatus}"
                    >
                      {getVerificationIcon(msg.verificationStatus)}
                    </span>
                    <button class="verify-btn" on:click={() => reverifyMessage(msg)}>↺</button>
                    <button class="details-btn" on:click={() => showDetails(msg)}>ℹ</button>
                  {/if}
                </div>
                <div class="message-content">{msg.content}</div>
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
  
  <!-- Verification Details Modal -->
  {#if showVerificationDetails && selectedMessage}
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Message Verification Details</h3>
          <button class="close-btn" on:click={closeDetails}>✕</button>
        </div>
        
        <div class="modal-body">
          <div class="verification-info">
            <h4>Status: 
              <span style="color: {getVerificationColor(selectedMessage.verificationStatus)}">
                {selectedMessage.verificationStatus}
              </span>
            </h4>
            
            <div class="message-details">
              <div><strong>From:</strong> {selectedMessage.from}</div>
              <div><strong>Message:</strong> {selectedMessage.content}</div>
              <div><strong>Timestamp:</strong> {selectedMessage.timestamp}</div>
            </div>
            
            {#if selectedMessage.signedMessage}
              <div class="signature-details">
                <h4>Signature Information:</h4>
                <pre>{formatJSON(selectedMessage.signedMessage.signature)}</pre>
                
                <h4>Message Hash:</h4>
                <pre>{selectedMessage.signedMessage.message_hash}</pre>
              </div>
            {/if}
            
            <div class="actions">
              <button class="verify-btn-large" on:click={() => selectedMessage && reverifyMessage(selectedMessage)}>
                Verify Again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .chat-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
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
  
  .message-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .verification-status {
    font-size: 16px;
    font-weight: bold;
  }
  
  .verify-btn, .details-btn {
    border: none;
    background: none;
    cursor: pointer;
    font-size: 12px;
    padding: 2px 4px;
    border-radius: 3px;
    background-color: #f0f0f0;
  }
  
  .message-content {
    margin-top: 4px;
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
  
  /* Modal styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
  }
  
  .modal-content {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #eee;
  }
  
  .modal-header h3 {
    margin: 0;
  }
  
  .close-btn {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
  }
  
  .modal-body {
    padding: 20px;
  }
  
  .verification-info h4 {
    margin-top: 0;
  }
  
  .message-details {
    margin: 15px 0;
    padding: 10px;
    background-color: #f5f5f5;
    border-radius: 4px;
  }
  
  .signature-details {
    margin: 15px 0;
  }
  
  .signature-details pre {
    background-color: #f5f5f5;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 12px;
  }
  
  .actions {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }
  
  .verify-btn-large {
    padding: 8px 16px;
    background-color: #1976d2;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  }
</style>