<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { createSignedMessage } from '$lib/chat/messageSigningFunctions';
  import { WebSocketService } from '$lib/chat/websocketService';
  import { ChatLocalStorageService } from '$lib/chat/localStorageService';
  import { clearPublicKeyCache } from '$lib/chat/verifyMessage';
  import type { Message, SignedMessage, VerificationStatus } from '$lib/chat/types';
  import ContactList from '../../components/contactList.svelte';
  
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
  let showContacts = true;
  let showDebugInfo = false;
  let debugMessages: Array<{direction: string, data: any, timestamp: string}> = [];
  
  // Handle connection status changes
  function handleConnectionStatus(status: string) {
    connectionStatus = status;
  }
  
  // Handle new messages
  function handleNewMessage(message: Message & { id?: string }) {
    // Add message to debug log if it's a received message with signature
    if (message.type === 'received' && message.signedMessage) {
      debugMessages = [...debugMessages, {
        direction: 'RECEIVED',
        data: message.signedMessage,
        timestamp: new Date().toISOString()
      }];
    }
    
    // Original handling continues
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
    
    // Hide contacts list when a conversation is selected on mobile
    if (window.innerWidth < 768) {
      showContacts = false;
    }
    
    // Load messages for this recipient
    const loadedMessages = ChatLocalStorageService.loadMessages(username, recipient);
    
    messages = loadedMessages;
    
    // Re-verify all loaded messages that need verification
    verifyLoadedMessages(loadedMessages);
    
    return loadedMessages;
  }
  
  // Handle contact selection
  function handleSelectContact(selectedUsername: string) {
    if (selectedUsername !== recipientUsername) {
      loadConversation(selectedUsername);
    }
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
      // Create the signed message first so we can capture it
      const signedMessage = await createSignedMessage(
        username,
        recipientUsername,
        messageText
      );
      
      // Add to debug log
      debugMessages = [...debugMessages, {
        direction: 'SENT',
        data: signedMessage,
        timestamp: new Date().toISOString()
      }];
      
      // Send using the service
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
  
  // Toggle contacts list on mobile
  function toggleContacts() {
    showContacts = !showContacts;
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
      localStorage.removeItem('user_id');
      goto('/login');
    }
  }

  // Function to toggle debug info
  function toggleDebugInfo() {
    showDebugInfo = !showDebugInfo;
  }
  
  // Function to clear debug logs
  function clearDebugLogs() {
    debugMessages = [];
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

<div class="max-w-5xl mx-auto p-4 font-sans">
  <header class="mb-4">
    <div class="flex justify-between items-center">
      <h1 class="text-xl font-bold">Secure Chat</h1>
      
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-600">Status: {connectionStatus}</span>
        <span class="text-sm text-gray-600">User: {username}</span>
        <button 
          class="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm"
          on:click={logout}
        >
          Logout
        </button>
      </div>
    </div>
  </header>
  
  {#if loadingUsername}
    <div class="text-center p-4 text-gray-600">Loading user information...</div>
  {:else if !username}
    <div class="text-red-500 p-4">
      <p>Not logged in. Redirecting to login page...</p>
    </div>
  {:else}
    <!-- Mobile contacts toggle button -->
    <div class="md:hidden mb-3">
      <button 
        class="w-full py-2 bg-blue-600 text-white font-medium rounded"
        on:click={toggleContacts}
      >
        {showContacts ? 'Hide Contacts' : 'Show Contacts'}
      </button>
    </div>
    
    <div class="flex flex-col md:flex-row gap-4">
      <!-- Contacts List - hidden on mobile when showContacts is false -->
      <div class={`${showContacts ? 'block' : 'hidden'} md:block md:w-1/3 bg-white p-3 rounded border`}>
        <ContactList 
          currentUsername={username}
          onSelectContact={handleSelectContact}
        />
      </div>
      
      <!-- Chat Area - full width on mobile, 2/3 on larger screens -->
      <div class={`${showContacts ? 'hidden' : 'block'} md:block md:w-2/3 flex flex-col gap-3`}>
        {#if recipientUsername}
          <div class="bg-white p-3 rounded border flex justify-between items-center">
            <div>
              <h2 class="font-medium">Chat with: {recipientUsername}</h2>
            </div>
            
            <!-- Show contacts button on mobile -->
            <button 
              class="md:hidden px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm"
              on:click={toggleContacts}
            >
              Back to Contacts
            </button>
          </div>
          
          <div class="border border-gray-200 rounded h-96 overflow-y-auto p-3 bg-gray-50">
            {#each messages as msg}
              <div class="mb-3">
                {#if msg.type === 'system'}
                  <div class="text-gray-600 text-sm p-2 bg-gray-100 rounded">
                    [{msg.timestamp}] SYSTEM: {msg.content}
                  </div>
                {:else if msg.type === 'error'}
                  <div class="text-red-600 text-sm p-2 bg-red-50 rounded">
                    [{msg.timestamp}] ERROR: {msg.content}
                  </div>
                {:else if msg.type === 'sent'}
                  <div class="flex justify-end">
                    <div class="text-white text-sm p-3 bg-blue-600 rounded-lg max-w-xs">
                      <div class="text-xs text-blue-200 mb-1">
                        Sent at {msg.timestamp}
                      </div>
                      <div>{msg.content}</div>
                    </div>
                  </div>
                {:else if msg.type === 'received'}
                  <div class="flex justify-start">
                    <div class="text-sm p-3 bg-gray-100 rounded-lg max-w-xs">
                      <div class="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <span>From {msg.from} at {msg.timestamp}</span>
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
                            title="Reverify message"
                          >↺</button>
                          <button 
                            class="text-xs bg-gray-200 px-1 rounded" 
                            on:click={() => showDetails(msg)}
                            title="Message details"
                          >ℹ</button>
                        {/if}
                      </div>
                      <div>{msg.content}</div>
                    </div>
                  </div>
                {:else if msg.type === 'delivered'}
                  <div class="text-amber-600 text-xs italic text-center my-1">
                    {msg.content}
                  </div>
                {:else if msg.type === 'saved'}
                <div class="flex justify-center">
                  <div class="text-amber-600 text-xs italic text-center my-1 bg-amber-50 px-2 py-1 rounded">
                    {msg.content}
                  </div>
                </div>
                {/if}
              </div>
            {/each}
            {#if messages.length === 0}
              <div class="text-center py-10 text-gray-500">
                No messages yet. Start the conversation!
              </div>
            {/if}
          </div>
          
          <div class="flex flex-col gap-2">
            <textarea 
              bind:value={messageText} 
              placeholder="Type your message..." 
              on:keydown={handleKeydown}
              rows="3"
              class="w-full p-3 border border-gray-300 rounded resize-y"
            ></textarea>
            <button 
              on:click={sendSignedMessage} 
              disabled={!messageText || !recipientUsername}
              class="py-2 bg-blue-600 text-white font-medium rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Send Message
            </button>
          </div>
        {:else}
          <div class="border border-gray-200 rounded p-10 text-center text-gray-500">
            <p>Select a contact from the list to start chatting</p>
          </div>
        {/if}
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

<div class="mt-4">
  <button 
    on:click={toggleDebugInfo}
    class="px-2 py-1 bg-gray-200 border border-gray-300 rounded text-sm"
  >
    {showDebugInfo ? 'Hide' : 'Show'} Debug Info
  </button>
  
  {#if showDebugInfo}
    <div class="mt-2 border p-2 rounded bg-gray-50">
      <div class="flex justify-between items-center mb-2">
        <h3 class="font-bold">Message Debug Information</h3>
        <button 
          on:click={clearDebugLogs}
          class="px-2 py-1 bg-red-100 border border-red-300 rounded text-xs"
        >
          Clear Logs
        </button>
      </div>
      
      {#if debugMessages.length === 0}
        <p class="text-gray-500 text-sm">No messages logged yet. Send or receive a message to see debug info.</p>
      {:else}
        <div class="max-h-96 overflow-y-auto">
          {#each debugMessages as debug}
            <div class="mb-3 p-2 border-b">
              <div class="font-mono text-xs mb-1">
                <span class={debug.direction === 'SENT' ? 'text-blue-600' : 'text-green-600'}>
                  [{debug.direction}] {debug.timestamp}
                </span>
              </div>
              <pre class="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                {JSON.stringify(debug.data, null, 2)}
              </pre>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>