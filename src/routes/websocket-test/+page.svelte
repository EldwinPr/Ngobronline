<!-- src/routes/websocket-test/+page.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  
  let status = 'Disconnected';
  let messages: Array<{text: string}> = [];
  let socket: WebSocket | null = null;
  let inputMessage = '';
  
  function connect(): void {
    // Connect to our standalone WebSocket server
    socket = new WebSocket('ws://localhost:3001');
    
    socket.onopen = () => {
      status = 'Connected';
      messages = [...messages, { text: 'Connected to WebSocket server' }];
    };
    
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        messages = [...messages, { text: data.message }];
      } catch (error) {
        messages = [...messages, { text: 'Failed to parse message' }];
      }
    };
    
    socket.onclose = () => {
      status = 'Disconnected';
      messages = [...messages, { text: 'Disconnected from server' }];
      socket = null;
    };
    
    socket.onerror = () => {
      status = 'Error';
      messages = [...messages, { text: 'WebSocket error' }];
    };
  }
  
  function disconnect(): void {
    if (socket) {
      socket.close();
    }
  }
  
  function sendMessage(): void {
    if (socket && socket.readyState === WebSocket.OPEN && inputMessage.trim()) {
      socket.send(inputMessage);
      messages = [...messages, { text: `Sent: ${inputMessage}` }];
      inputMessage = '';
    }
  }
  
  onMount(() => {
    connect();
  });
  
  onDestroy(() => {
    disconnect();
  });
</script>

<div>
  <h1>WebSocket Test</h1>
  
  <div>
    <p>Status: {status}</p>
    
    <div>
      <button on:click={connect} disabled={!!socket && socket.readyState !== WebSocket.CLOSED}>
        Connect
      </button>
      <button on:click={disconnect} disabled={!socket || socket.readyState !== WebSocket.OPEN}>
        Disconnect
      </button>
    </div>
  </div>
  
  <div style="border: 1px solid #ccc; height: 200px; overflow-y: auto; margin: 10px 0; padding: 10px;">
    {#each messages as message}
      <div>{message.text}</div>
    {/each}
  </div>
  
  <div>
    <input 
      type="text" 
      bind:value={inputMessage} 
      placeholder="Type a message..." 
      disabled={!socket || socket.readyState !== WebSocket.OPEN} 
    />
    <button 
      on:click={sendMessage} 
      disabled={!socket || socket.readyState !== WebSocket.OPEN || !inputMessage.trim()}
    >
      Send
    </button>
  </div>
</div>
