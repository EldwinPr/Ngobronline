<!-- src/routes/ws-test/+page.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  
  let messages: string[] = [];
  let inputText = '';
  let socket: WebSocket | null = null;
  let connected = false;
  
  function addMessage(text: string) {
    messages = [...messages, text];
  }
  
  function connectWebSocket() {
    socket = new WebSocket('ws://localhost:3001');
    
    socket.onopen = () => {
      connected = true;
      addMessage('Connected to server');
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        addMessage(`Server: ${data.message}`);
      } catch (e) {
        addMessage(`Raw message: ${event.data}`);
      }
    };
    
    socket.onclose = () => {
      connected = false;
      addMessage('Disconnected from server');
      socket = null;
    };
    
    socket.onerror = () => {
      addMessage('WebSocket error occurred');
    };
  }
  
  function disconnectWebSocket() {
    if (socket) {
      socket.close();
    }
  }
  
  function handleSendMessage() {
    if (socket && connected && inputText.trim()) {
      // Send as plain text
      socket.send(inputText);
      addMessage(`You: ${inputText}`);
      inputText = '';
    }
  }
  
  onMount(() => {
    connectWebSocket();
  });
  
  onDestroy(() => {
    disconnectWebSocket();
  });
</script>

<main>
  <h1>WebSocket Test</h1>
  
  <div class="status">
    <p>Status: {connected ? 'Connected' : 'Disconnected'}</p>
    <button on:click={connectWebSocket} disabled={connected}>Connect</button>
    <button on:click={disconnectWebSocket} disabled={!connected}>Disconnect</button>
  </div>
  
  <div class="message-container">
    {#each messages as message}
      <div class="message">{message}</div>
    {/each}
  </div>
  
  <div class="input-area">
    <input 
      type="text" 
      bind:value={inputText} 
      placeholder="Type a message..." 
      disabled={!connected}
    />
    <button 
      on:click={handleSendMessage} 
      disabled={!connected || !inputText.trim()}
    >
      Send
    </button>
  </div>
</main>

<style>
  .message-container {
    height: 300px;
    overflow-y: auto;
    border: 1px solid #ccc;
    padding: 10px;
    margin: 10px 0;
  }
  
  .message {
    margin: 5px 0;
  }
  
  .input-area {
    display: flex;
    gap: 10px;
  }
  
  input {
    flex-grow: 1;
    padding: 5px;
  }
</style>
