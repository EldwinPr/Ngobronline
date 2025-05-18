<!-- src/routes/chat/+page.svelte (Refactored) -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { chatState } from '$lib/chat/chatState';
  import { initializeChat, setupBeforeUnload, cleanupChat } from '$lib/chat/chatInitialization';
  import { loadConversation } from '$lib/chat/chatHandlers';
  import { sendSignedMessage, handleKeydown, reverifyMessage } from '$lib/chat/messageActions';
  import { 
    toggleContacts, 
    showVerificationDetails, 
    closeVerificationDetails, 
    toggleDebugInfo, 
    clearDebugLogs, 
    logout,
    updateMessageText 
  } from '$lib/chat/uiActions';
  import { formatJSON, getVerificationIcon, getVerificationColor } from '$lib/chat/uiHelpers';
  import ContactList from '../../components/contactList.svelte';
  import type { Message } from '$lib/chat/types';

  // WebSocket service instance
  let websocketService = initializeChat();
  let cleanupBeforeUnload: (() => void) | undefined;

  // Reactive state from store
  $: state = $chatState;

  // Event handlers
  function handleSelectContact(selectedUsername: string) {
    if (selectedUsername !== state.recipientUsername) {
      loadConversation(websocketService, selectedUsername);
    }
  }

  function handleSendMessage() {
    sendSignedMessage(websocketService);
  }

  function handleMessageKeydown(event: KeyboardEvent) {
    handleKeydown(event, websocketService);
  }

  function handleReverifyMessage(message: Message & { id?: string }) {
    reverifyMessage(websocketService, message);
  }

  function handleShowDetails(message: Message & { id?: string }) {
    showVerificationDetails(message);
  }

  function handleMessageTextInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    updateMessageText(target.value);
  }

  // Component lifecycle
  onMount(() => {
    cleanupBeforeUnload = setupBeforeUnload();
  });

  onDestroy(() => {
    cleanupChat(websocketService);
    if (cleanupBeforeUnload) {
      cleanupBeforeUnload();
    }
  });
</script>

<div class="max-w-5xl mx-auto p-4 font-sans">
  <header class="mb-4">
    <div class="flex justify-between items-center">
      <h1 class="text-xl font-bold">Secure Chat</h1>
      
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-600">Status: {state.connectionStatus}</span>
        <span class="text-sm text-gray-600">User: {state.username}</span>
        <button 
          class="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm"
          on:click={logout}
        >
          Logout
        </button>
      </div>
    </div>
  </header>
  
  {#if state.loadingUsername}
    <div class="text-center p-4 text-gray-600">Loading user information...</div>
  {:else if !state.username}
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
        {state.showContacts ? 'Hide Contacts' : 'Show Contacts'}
      </button>
    </div>
    
    <div class="flex flex-col md:flex-row gap-4">
      <!-- Contacts List -->
      <div class={`${state.showContacts ? 'block' : 'hidden'} md:block md:w-1/3 bg-white p-3 rounded border`}>
        <ContactList 
          currentUsername={state.username}
          onSelectContact={handleSelectContact}
        />
      </div>
      
      <!-- Chat Area -->
      <div class={`${state.showContacts ? 'hidden' : 'block'} md:block md:w-2/3 flex flex-col gap-3`}>
        {#if state.recipientUsername}
          <div class="bg-white p-3 rounded border flex justify-between items-center">
            <div>
              <h2 class="font-medium">Chat with: {state.recipientUsername}</h2>
            </div>
            
            <!-- Show contacts button on mobile -->
            <button 
              class="md:hidden px-2 py-1 bg-gray-100 border border-gray-300 rounded text-sm"
              on:click={toggleContacts}
            >
              Back to Contacts
            </button>
          </div>
          
          <!-- Messages Container -->
          <div class="border border-gray-200 rounded h-96 overflow-y-auto p-3 bg-gray-50">
            {#each state.messages as msg}
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
                            on:click={() => handleReverifyMessage(msg)}
                            title="Reverify message"
                          >↺</button>
                          <button 
                            class="text-xs bg-gray-200 px-1 rounded" 
                            on:click={() => handleShowDetails(msg)}
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
            {#if state.messages.length === 0}
              <div class="text-center py-10 text-gray-500">
                No messages yet. Start the conversation!
              </div>
            {/if}
          </div>
          
          <!-- Message Input -->
          <div class="flex flex-col gap-2">
            <textarea 
              value={state.messageText}
              on:input={handleMessageTextInput}
              placeholder="Type your message..." 
              on:keydown={handleMessageKeydown}
              rows="3"
              class="w-full p-3 border border-gray-300 rounded resize-y"
            ></textarea>
            <button 
              on:click={handleSendMessage} 
              disabled={!state.messageText || !state.recipientUsername}
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
  
  <!-- Verification Modal -->
  {#if state.showVerificationDetails && state.selectedMessage}
    <div class="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div class="bg-white rounded-lg w-11/12 max-w-lg max-h-[80vh] overflow-y-auto">
        <div class="flex justify-between items-center p-4 border-b">
          <h3 class="font-medium">Message Verification Details</h3>
          <button class="text-lg" on:click={closeVerificationDetails}>✕</button>
        </div>
        
        <div class="p-4">
          <h4 class="font-medium">
            Status: 
            <span class={getVerificationColor(state.selectedMessage.verificationStatus)}>
              {state.selectedMessage.verificationStatus}
            </span>
          </h4>
          
          <div class="my-3 p-2 bg-gray-100 rounded">
            <div><strong>From:</strong> {state.selectedMessage.from}</div>
            <div><strong>Message:</strong> {state.selectedMessage.content}</div>
            <div><strong>Timestamp:</strong> {state.selectedMessage.timestamp}</div>
          </div>
          
          {#if state.selectedMessage.signedMessage}
            <div class="my-3">
              <h4 class="font-medium">Signature Information:</h4>
              <pre class="bg-gray-100 p-2 rounded overflow-x-auto text-xs">{formatJSON(state.selectedMessage.signedMessage.signature)}</pre>
              
              <h4 class="font-medium mt-3">Message Hash:</h4>
              <pre class="bg-gray-100 p-2 rounded overflow-x-auto text-xs">{state.selectedMessage.signedMessage.message_hash}</pre>
            </div>
          {/if}
          
          <div class="flex justify-center mt-4">
            <button 
              class="px-4 py-2 bg-blue-600 text-white rounded" 
              on:click={() => state.selectedMessage && handleReverifyMessage(state.selectedMessage)}
            >
              Verify Again
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Debug Panel -->
<div class="mt-4">
  <button 
    on:click={toggleDebugInfo}
    class="px-2 py-1 bg-gray-200 border border-gray-300 rounded text-sm"
  >
    {state.showDebugInfo ? 'Hide' : 'Show'} Debug Info
  </button>
  
  {#if state.showDebugInfo}
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
      
      {#if state.debugMessages.length === 0}
        <p class="text-gray-500 text-sm">No messages logged yet. Send or receive a message to see debug info.</p>
      {:else}
        <div class="max-h-96 overflow-y-auto">
          {#each state.debugMessages as debug}
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