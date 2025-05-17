<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { createSignedMessage } from '$lib/chat/messageSigningFunctions';
  import { WebSocketService } from '$lib/chat/websocketService';
  import { ChatLocalStorageService } from '$lib/chat/localStorageService';
  import { clearPublicKeyCache } from '$lib/chat/verifyMessage';
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
  let autoSaveEnabled = true;
  
  // Handle connection status changes
  function handleConnectionStatus(status: string) {
    connectionStatus = status;
  }
  
  // Handle new messages
  function handleNewMessage(message: Message & { id?: string }) {
    messages = [...messages, message];
    
    // Save messages when a new one is added
    if (autoSaveEnabled && browser && username && recipientUsername) {
      saveCurrentConversation();
    }
  }
  
  // Handle verification status updates
  function handleVerificationUpdate(messageId: string, status: VerificationStatus, isValid?: boolean) {
    messages = messages.map(msg => {
      if (msg.id === messageId) {
        const updatedMsg = { ...msg, verificationStatus: status };
        return updatedMsg;
      }
      return msg;
    });
    
    // Save messages after verification updates
    if (autoSaveEnabled && browser && username && recipientUsername) {
      saveCurrentConversation();
    }
  }
  
  // Save the current conversation to local storage
  function saveCurrentConversation() {
    if (!browser || !username || !recipientUsername || !messages.length) {
      return;
    }
    
    ChatLocalStorageService.saveMessages(username, recipientUsername, messages);
  }
  
  // Load conversation with a specific recipient
  function loadConversation(recipient: string) {
    if (!browser || !username || !recipient) {
      return [];
    }
    
    // Save current conversation first if applicable
    if (recipientUsername && messages.length) {
      saveCurrentConversation();
    }
    
    // Update recipient
    recipientUsername = recipient;
    
    // Load messages for this recipient
    const loadedMessages = ChatLocalStorageService.loadMessages(username, recipient);
    
    messages = loadedMessages;
    
    // Re-verify all loaded messages that need verification
    verifyLoadedMessages(loadedMessages);
    
    return loadedMessages;
  }
  
  // Verify all loaded messages that have signatures
  function verifyLoadedMessages(loadedMessages: (Message & { id?: string })[]) {
    if (!websocketService) return;
    
    // Temporarily disable auto-save to prevent excessive saves during verification
    autoSaveEnabled = false;
    
    // Add IDs to messages that don't have them (for older conversations)
    loadedMessages.forEach(msg => {
      if (msg.type === 'received' && msg.signedMessage) {
        if (!msg.id) {
          msg.id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        }
        
        if (msg.id && websocketService) {
          // Use the special method for verifying loaded messages
          websocketService.verifyLoadedMessage(msg.id, msg.signedMessage);
        }
      }
    });
    
    // Re-enable auto-save after a short delay
    setTimeout(() => {
      autoSaveEnabled = true;
      saveCurrentConversation(); // Save once after all verifications
    }, 500);
  }
  
  // Send a signed message
  async function sendSignedMessage(): Promise<void> {
    if (!websocketService || !messageText || !recipientUsername) return;
    
    try {
      await websocketService.sendSignedMessage(recipientUsername, messageText, createSignedMessage);
      
      // Clear input after successful send
      messageText = '';
      
      // Manual save after sending to ensure the message is captured
      if (browser && username && recipientUsername) {
        setTimeout(() => saveCurrentConversation(), 100);
      }
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
      
      // Save after adding error message
      saveCurrentConversation();
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
  
  // Change current recipient
  function changeRecipient(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.value !== recipientUsername) {
      loadConversation(input.value);
    }
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
      case 'verified': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'verifying': return 'text-blue-500';
      case 'pending': return 'text-gray-500';
      default: return '';
    }
  }
  
  // Logout function
  function logout(): void {
    if (browser) {
      // Save any current messages before logout
      if (username && recipientUsername && messages.length) {
        saveCurrentConversation();
      }
      
      localStorage.removeItem('username');
      goto('/login');
    }
  }
  
  // Load recent conversation partners
  function loadRecentPartners(): string[] {
    if (!browser || !username) return [];
    return ChatLocalStorageService.getConversationPartners(username);
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
      
      // If there's a recipient in URL params or state, load that conversation
      if (recipientUsername) {
        loadConversation(recipientUsername);
      }
      
      // Set up beforeunload handler to save before page navigation
      window.addEventListener('beforeunload', () => {
        if (username && recipientUsername && messages.length) {
          saveCurrentConversation();
        }
      });
    }
  });
  
  // Clean up on component destroy
  onDestroy(() => {
    // Save current conversation before unmounting
    if (browser && username && recipientUsername && messages.length) {
      saveCurrentConversation();
    }
    
    if (websocketService) {
      websocketService.disconnect();
    }
    
    // Remove the beforeunload handler
    if (browser) {
      window.removeEventListener('beforeunload', () => {});
    }
  });
</script>

<div class="max-w-2xl mx-auto p-4 font-sans">
  <header class="mb-4">
    <h1 class="text-xl font-bold mb-2">Secure Chat</h1>
    <div class="text-gray-600 text-sm flex items-center gap-2">
      <span>Status: {connectionStatus}</span>
    </div>
  </header>
  
  {#if loadingUsername}
    <div class="text-center p-4 text-gray-600">Loading user information...</div>
  {:else if !username}
    <div class="text-red-500 p-4">
      <p>Not logged in. Redirecting to login page...</p>
    </div>
  {:else}
    <div class="flex flex-col gap-3">
      <div class="flex justify-between items-center">
        <span>Connected as: <strong>{username}</strong></span>
        <button 
          class="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm"
          on:click={logout}
        >
          Logout
        </button>
      </div>
      
      <div>
        <input 
          type="text" 
          bind:value={recipientUsername} 
          placeholder="Recipient username"
          on:change={changeRecipient}
          class="w-full p-2 border border-gray-300 rounded mb-2"
        />
        
        {#if loadRecentPartners().length > 0}
          <select 
            on:change={(e) => loadConversation((e.target as HTMLSelectElement).value)}
            class="w-full p-2 border border-gray-300 rounded bg-gray-50"
          >
            <option value="">Recent conversations</option>
            {#each loadRecentPartners() as partner}
              <option value={partner}>{partner}</option>
            {/each}
          </select>
        {/if}
      </div>
      
      <div class="border border-gray-200 rounded h-64 overflow-y-auto p-2 bg-gray-50">
        {#each messages as msg}
          <div class="mb-2">
            {#if msg.type === 'system'}
              <div class="text-gray-600 text-sm">
                [{msg.timestamp}] SYSTEM: {msg.content}
              </div>
            {:else if msg.type === 'error'}
              <div class="text-red-600 text-sm">
                [{msg.timestamp}] ERROR: {msg.content}
              </div>
            {:else if msg.type === 'sent'}
              <div class="text-blue-600 text-sm">
                [{msg.timestamp}] TO {msg.to}: {msg.content}
              </div>
            {:else if msg.type === 'received'}
              <div class="text-green-700 text-sm">
                <div class="flex items-center gap-1">
                  <span>[{msg.timestamp}] FROM {msg.from}:</span>
                  
                  {#if msg.verificationStatus}
                    <span 
                      class={`font-bold ${getVerificationColor(msg.verificationStatus)}`}
                      title="Verification: {msg.verificationStatus}"
                    >
                      {getVerificationIcon(msg.verificationStatus)}
                    </span>
                    <button 
                      class="text-xs bg-gray-200 px-1 rounded" 
                      on:click={() => reverifyMessage(msg)}
                    >↺</button>
                    <button 
                      class="text-xs bg-gray-200 px-1 rounded" 
                      on:click={() => showDetails(msg)}
                    >ℹ</button>
                  {/if}
                </div>
                <div class="mt-1">{msg.content}</div>
              </div>
            {:else if msg.type === 'delivered'}
              <div class="text-amber-600 text-sm italic">
                [{msg.timestamp}] {msg.content}
              </div>
            {/if}
          </div>
        {/each}
      </div>
      
      <div class="flex flex-col gap-2">
        <textarea 
          bind:value={messageText} 
          placeholder="Type your message..." 
          on:keydown={handleKeydown}
          rows="3"
          class="w-full p-2 border border-gray-300 rounded resize-y"
        ></textarea>
        <button 
          on:click={sendSignedMessage} 
          disabled={!messageText || !recipientUsername}
          class="py-2 bg-blue-600 text-white font-medium rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Send Message
        </button>
      </div>
    </div>
  {/if}
  
  {#if showVerificationDetails && selectedMessage}
    <div class="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div class="bg-white rounded-lg w-11/12 max-w-lg max-h-[80vh] overflow-y-auto">
        <div class="flex justify-between items-center p-4 border-b">
          <h3 class="font-medium">Message Verification Details</h3>
          <button class="text-lg" on:click={closeDetails}>✕</button>
        </div>
        
        <div class="p-4">
          <h4 class="font-medium">
            Status: 
            <span class={getVerificationColor(selectedMessage.verificationStatus)}>
              {selectedMessage.verificationStatus}
            </span>
          </h4>
          
          <div class="my-3 p-2 bg-gray-100 rounded">
            <div><strong>From:</strong> {selectedMessage.from}</div>
            <div><strong>Message:</strong> {selectedMessage.content}</div>
            <div><strong>Timestamp:</strong> {selectedMessage.timestamp}</div>
          </div>
          
          {#if selectedMessage.signedMessage}
            <div class="my-3">
              <h4 class="font-medium">Signature Information:</h4>
              <pre class="bg-gray-100 p-2 rounded overflow-x-auto text-xs">{formatJSON(selectedMessage.signedMessage.signature)}</pre>
              
              <h4 class="font-medium mt-3">Message Hash:</h4>
              <pre class="bg-gray-100 p-2 rounded overflow-x-auto text-xs">{selectedMessage.signedMessage.message_hash}</pre>
            </div>
          {/if}
          
          <div class="flex justify-center mt-4">
            <button 
              class="px-4 py-2 bg-blue-600 text-white rounded" 
              on:click={() => selectedMessage && reverifyMessage(selectedMessage)}
            >
              Verify Again
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>