<!-- routes/chat/+page.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { createSignedMessage } from '$lib/messageSigningFunctions';
  import * as secp256k1 from '@noble/secp256k1';
  
  // Define types
  type MessageType = 'system' | 'chat' | 'error' | 'delivered' | 'sent' | 'received' | 'debug';
  
  interface Message {
    type: MessageType;
    content: string;
    timestamp: string;
    from?: string;
    to?: string;
  }
  
  interface WebSocketMessage {
    type: string;
    username?: string;
    to?: string;
    from?: string;
    content?: string;
    message?: any;
    timestamp?: number;
  }
  
  interface SignedMessage {
    sender_username: string;
    receiver_username: string;
    plaintext_message: string;
    message_hash: string;
    signature: {
      r: string;
      s: string;
    };
    timestamp: string;
  }
  
  // State variables
  let ws: WebSocket | null = null;
  let connected = false;
  let username = '';
  let recipientUsername = '';
  let messageText = '';
  let messages: Message[] = [];
  let userIdentified = false;
  let connectionStatus = 'Disconnected';
  let loadingUsername = true;
  let lastSignedMessage: SignedMessage | null = null;
  let showMessageFormat = false;
  let debugMode = true; // Enable debug mode by default
  
  // Check authentication and redirect if not logged in
  onMount(() => {
    if (browser) {
      const storedUsername = localStorage.getItem('username');
      if (!storedUsername) {
        goto('/login');
        return;
      }
      
      username = storedUsername;
      loadingUsername = false;
      connect();
      
      // Add debug message
      addDebugMessage(`Authenticated as ${username}`);
    }
  });
  
  // Helper function to add debug messages
  function addDebugMessage(content: string) {
    if (debugMode) {
      messages = [...messages, {
        type: 'debug',
        content,
        timestamp: new Date().toLocaleTimeString()
      }];
    }
    console.log(`[DEBUG] ${content}`);
  }
  
  // Connect to WebSocket server
  function connect(): void {
    if (!browser) return;
    
    ws = new WebSocket('ws://localhost:3001');
    
    ws.onopen = () => {
      connected = true;
      connectionStatus = 'Connected to server';
      
      // Auto-identify if username is available
      if (username) {
        identifyUser();
      }
    };
    
    ws.onclose = () => {
      connected = false;
      userIdentified = false;
      connectionStatus = 'Disconnected';
      
      // Attempt to reconnect after a delay
      setTimeout(connect, 3000);
    };
    
    ws.onerror = (error) => {
      connectionStatus = 'Connection error';
      console.error('WebSocket error:', error);
    };
    
    ws.onmessage = (event) => {
      try {
        const rawData = event.data;
        addDebugMessage(`Raw WebSocket message: ${rawData}`);
        
        const data: WebSocketMessage = JSON.parse(rawData);
        console.log('Parsed WebSocket message:', data);
        
        // Handle different message types
        switch (data.type) {
          case 'system':
            if (data.message) {
              messages = [...messages, {
                type: 'system',
                content: typeof data.message === 'string' ? data.message : JSON.stringify(data.message),
                timestamp: new Date().toLocaleTimeString()
              }];
            }
            break;
            
          case 'chat':
            if (data.from && data.content) {
              messages = [...messages, {
                type: 'received',
                from: data.from,
                content: data.content,
                timestamp: data.timestamp 
                  ? new Date(data.timestamp).toLocaleTimeString() 
                  : new Date().toLocaleTimeString()
              }];
            }
            break;
            
          case 'signed_chat':
            addDebugMessage(`Processing signed_chat: ${JSON.stringify(data)}`);
            
            try {
              // Extract the signed message from the data
              let signedMsg: SignedMessage;
              
              if (typeof data.message === 'string') {
                addDebugMessage(`Parsing string message: ${data.message}`);
                signedMsg = JSON.parse(data.message);
              } else {
                addDebugMessage(`Using object message: ${JSON.stringify(data.message)}`);
                signedMsg = data.message as SignedMessage;
              }
              
              addDebugMessage(`Extracted signed message: ${JSON.stringify(signedMsg)}`);
              
              // Check if message is valid
              if (!signedMsg || !signedMsg.sender_username || !signedMsg.receiver_username) {
                addDebugMessage('Invalid signed message format');
                return;
              }
              
              // Store the last received signed message for inspection
              lastSignedMessage = signedMsg;
              
              // Add to messages array regardless of recipient
              // This helps debug if messages are being received but not displayed
              addDebugMessage(`Adding signed message from ${signedMsg.sender_username} to ${signedMsg.receiver_username}`);
              
              messages = [...messages, {
                type: 'received',
                from: signedMsg.sender_username,
                to: signedMsg.receiver_username,
                content: `${signedMsg.plaintext_message} [SIGNED]`,
                timestamp: new Date(signedMsg.timestamp).toLocaleTimeString()
              }];
              
            } catch (parseError) {
              console.error('Error processing signed message:', parseError);
              addDebugMessage(`Error processing signed message: ${parseError}`);
              
              messages = [...messages, {
                type: 'error',
                content: `Failed to parse signed message: ${parseError}`,
                timestamp: new Date().toLocaleTimeString()
              }];
            }
            break;
            
          case 'error':
            if (data.message) {
              messages = [...messages, {
                type: 'error',
                content: typeof data.message === 'string' ? data.message : JSON.stringify(data.message),
                timestamp: new Date().toLocaleTimeString()
              }];
            }
            break;
            
          default:
            addDebugMessage(`Unknown message type: ${data.type}`);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
        addDebugMessage(`Error parsing message: ${error}`);
      }
    };
  }
  
  // Identify user to the server
  function identifyUser(): void {
    if (!connected || !username || !ws) return;
    
    ws.send(JSON.stringify({
      type: 'identify',
      username: username
    }));
    
    userIdentified = true;
  }
  
  // Send a regular message
  function sendMessage(): void {
    if (!connected || !userIdentified || !messageText || !recipientUsername || !ws) return;
    
    ws.send(JSON.stringify({
      type: 'chat',
      to: recipientUsername,
      content: messageText
    }));
    
    // Add message to local display
    messages = [...messages, {
      type: 'sent',
      to: recipientUsername,
      content: messageText,
      timestamp: new Date().toLocaleTimeString()
    }];
    
    // Clear message input
    messageText = '';
  }
  
  // Send a signed message
  async function sendSignedMessage(): Promise<void> {
    if (!connected || !userIdentified || !messageText || !recipientUsername || !ws) return;
    
    try {
      addDebugMessage('Creating signed message...');
      
      // Create signed message
      const signedMessage = await createSignedMessage(
        username,
        recipientUsername,
        messageText
      );
      
      addDebugMessage(`Sending signed message: ${JSON.stringify(signedMessage)}`);
      
      // Store for inspection
      lastSignedMessage = signedMessage;
      
      // Send via WebSocket
      ws.send(JSON.stringify({
        type: 'signed_chat',
        message: signedMessage
      }));
      
      // Add to local messages
      messages = [...messages, {
        type: 'sent',
        to: recipientUsername,
        content: `${messageText} [SIGNED]`,
        timestamp: new Date().toLocaleTimeString()
      }];
      
      // Clear input
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
  
  // Toggle showing the message format
  function toggleMessageFormat(): void {
    showMessageFormat = !showMessageFormat;
  }
  
  // Toggle debug mode
  function toggleDebugMode(): void {
    debugMode = !debugMode;
  }
  
  // Format JSON for display
  function formatJSON(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }
  
  // Handle Enter key in message input
  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }
  
  // Logout function
  function logout(): void {
    if (browser) {
      localStorage.removeItem('username');
      goto('/login');
    }
  }
  
  // Clean up on component destroy
  onDestroy(() => {
    if (ws) {
      ws.close();
    }
  });
</script>

<h1>Simple Chat</h1>

<div>
  <div>
    <span>Status: {connectionStatus}</span>
    <button on:click={toggleDebugMode} style="margin-left: 10px; padding: 2px 5px;">
      {debugMode ? 'Disable' : 'Enable'} Debug
    </button>
  </div>
  
  {#if loadingUsername}
    <div>Loading user information...</div>
  {:else if !username}
    <div>
      <p>Not logged in. Redirecting to login page...</p>
    </div>
  {:else if connected && !userIdentified}
    <div>
      <p>Connecting as {username}...</p>
    </div>
  {:else if connected && userIdentified}
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <span>Connected as: <strong>{username}</strong></span>
        <button on:click={logout} style="padding: 5px 10px;">Logout</button>
      </div>
      
      <div>
        <input 
          type="text" 
          bind:value={recipientUsername} 
          placeholder="Recipient username"
        />
      </div>
      
      <div style="border: 1px solid #ccc; height: 300px; overflow-y: auto; margin: 10px 0; padding: 10px;">
        {#each messages as msg}
          <div>
            {#if msg.type === 'system'}
              <div style="color: gray;">
                [{msg.timestamp}] SYSTEM: {msg.content}
              </div>
            {:else if msg.type === 'error'}
              <div style="color: red;">
                [{msg.timestamp}] ERROR: {msg.content}
              </div>
            {:else if msg.type === 'debug'}
              <div style="color: purple; font-style: italic;">
                [{msg.timestamp}] DEBUG: {msg.content}
              </div>
            {:else if msg.type === 'sent'}
              <div style="color: blue;">
                [{msg.timestamp}] TO {msg.to}: {msg.content}
              </div>
            {:else if msg.type === 'received'}
              <div style="color: green;">
                [{msg.timestamp}] FROM {msg.from}: {msg.content}
              </div>
            {/if}
          </div>
        {/each}
      </div>
      
      <div>
        <textarea 
          bind:value={messageText} 
          placeholder="Type your message..." 
          on:keydown={handleKeydown}
          rows="3"
          style="width: 100%;"
        ></textarea>
        <div style="display: flex; gap: 10px; margin-top: 5px;">
          <button on:click={sendMessage} disabled={!messageText || !recipientUsername}>
            Send
          </button>
          <button on:click={sendSignedMessage} disabled={!messageText || !recipientUsername}>
            Send Signed
          </button>
        </div>
      </div>
      
      <!-- Message format inspection section -->
      {#if lastSignedMessage}
        <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">
          <button on:click={toggleMessageFormat}>
            {showMessageFormat ? 'Hide' : 'Show'} Signed Message Format
          </button>
          
          {#if showMessageFormat}
            <div style="background-color: #f5f5f5; padding: 10px; margin-top: 10px; border-radius: 5px; overflow-x: auto;">
              <h3>Last Signed Message:</h3>
              <pre>{formatJSON(lastSignedMessage)}</pre>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>
