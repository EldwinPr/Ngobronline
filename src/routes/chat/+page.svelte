<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { fly, fade } from 'svelte/transition';
  
  import { chatState } from '$lib/chat/chatState';
  import { initializeChat, cleanupChat } from '$lib/chat/chatInitialization';
  import { loadConversation } from '$lib/chat/chatHandlers';
  import { sendSignedMessage, reverifyMessage } from '$lib/chat/messageActions';
  import type { Message } from '$lib/chat/types';
  import type { WebSocketService } from '$lib/chat/websocketService';
  
  import ContactList from '../../components/contactList.svelte';
  import ChatBubble from '../../components/chatBubble.svelte';
  import InputMessage from '../../components/inputMessage.svelte';
  import SettingsModal from '../../components/SettingsModal.svelte';

  let websocketService = initializeChat();
  let showSettings = false;
  let showSidebar = true;
  let isMobile = false;
  let chatContainer: HTMLDivElement;
  let lastReceivedCount = 0;

  $: state = $chatState;
  $: hasContact = !!state.recipientUsername;
  $: connectionColor = state.connectionStatus === 'Connected to server' ? 'bg-green-500' : 'bg-red-500';
  
  // Filter messages to only show those from the current conversation
  $: chatMessages = state.messages.filter(msg => {
    // For sent messages, show if they were sent to the current recipient
    if (msg.type === 'sent') {
      return msg.to === state.recipientUsername;
    }
    
    // For received messages, show if they were from the current recipient
    if (msg.type === 'received') {
      return msg.from === state.recipientUsername;
    }
    
    // For other message types (delivered, saved), show if they relate to current recipient
    return msg.to === state.recipientUsername;
  });
  
  // Sound notification for new messages in the current conversation
  $: {
    const currentReceived = chatMessages.filter(m => m.type === 'received').length;
    if (currentReceived > lastReceivedCount && lastReceivedCount > 0) {
      // Simple notification sound
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain).connect(ctx.destination);
        osc.frequency.value = 800;
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } catch (e) { console.error(e); }
    }
    lastReceivedCount = currentReceived;
  }

  // Core functions
  const checkMobile = () => {
    isMobile = window.innerWidth < 768;
    if (isMobile && hasContact) showSidebar = false;
  };

  const handleSelectContact = (username: string) => {
    loadConversation(websocketService, username);
    if (isMobile) showSidebar = false;
    
    // Update last received count for the new conversation
    lastReceivedCount = state.messages.filter(m => 
      m.type === 'received' && m.from === username
    ).length;
    
    setTimeout(() => chatContainer?.scrollTo(0, chatContainer.scrollHeight), 100);
  };

  const handleSendMessage = (e: CustomEvent<{message: string}>) => {
    chatState.update(s => ({ ...s, messageText: e.detail.message }));
    sendSignedMessage(websocketService);
    setTimeout(() => chatContainer?.scrollTo(0, chatContainer.scrollHeight), 50);
  };

  const handleReverify = (e: CustomEvent<{messageId: string}>) => {
    const msg = chatMessages.find(m => m.id === e.detail.messageId);
    if (msg) reverifyMessage(websocketService, msg);
  };

  const handleShowDetails = (e: CustomEvent<{messageId: string}>) => {
    const msg = chatMessages.find(m => m.id === e.detail.messageId);
    if (msg) chatState.update(s => ({ ...s, selectedMessage: msg, showVerificationDetails: true }));
  };

  const handleLogout = () => {
    if (browser) {
      ['username', 'user_id', 'ecdsa_private_key'].forEach(localStorage.removeItem);
      goto('/login');
    }
  };

  const closeModal = () => chatState.update(s => ({ ...s, showVerificationDetails: false }));
  
  const reverifyFromModal = () => {
    if (state.selectedMessage?.id) {
      const msg = chatMessages.find(m => m.id === state.selectedMessage!.id);
      if (msg) reverifyMessage(websocketService, msg);
    }
  };

  const copySignatureData = () => {
    if (state.selectedMessage?.signedMessage) {
      navigator.clipboard.writeText(JSON.stringify(state.selectedMessage.signedMessage, null, 2))
        .catch(console.error);
    }
  };

  onMount(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  });

  onDestroy(() => cleanupChat(websocketService));
</script>

<svelte:head>
  <title>{hasContact ? `Chat dengan ${state.recipientUsername}` : 'Chat'} - ngobronline</title>
</svelte:head>

<div class="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
  <!-- Header -->
  <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button 
          on:click={() => showSidebar = !showSidebar} 
          class="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <h1 class="text-xl font-bold text-amber-500">ngobronline</h1>
        <div class="flex items-center gap-2">
          <div class="{connectionColor} w-2 h-2 rounded-full animate-pulse"></div>
          <span class="text-sm text-gray-600 dark:text-gray-400">{state.connectionStatus}</span>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <span class="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">{state.username}</span>
        <div class="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
          {state.username?.charAt(0).toUpperCase() ?? '?'}
        </div>
        <button on:click={() => showSettings = true} class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </button>
        <button on:click={handleLogout} class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-red-500">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
        </button>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 flex overflow-hidden">
    {#if state.loadingUsername}
      <div class="flex-1 flex items-center justify-center">
        <div class="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    {:else if !state.username}
      <div class="flex-1 flex items-center justify-center">
        <button on:click={() => goto('/login')} class="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600">
          Ke halaman login
        </button>
      </div>
    {:else}
      <!-- Sidebar -->
      {#if showSidebar}
        <aside class="w-full md:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700" 
               transition:fly="{{ x: -320, duration: 300 }}">
          <ContactList
            currentUsername={state.username}
            selectedContact={state.recipientUsername}
            onSelectContact={handleSelectContact}
          />
        </aside>
      {/if}

      <!-- Chat Area -->
      <div class="flex-1 flex flex-col">
        {#if hasContact}
          <!-- Chat Header -->
          <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
            <div class="flex items-center gap-3">
              {#if isMobile}
                <button on:click={() => showSidebar = true} class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
              {/if}
              <div class="w-10 h-10 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full flex items-center justify-center">
                {state.recipientUsername.charAt(0).toUpperCase()}
              </div>
              <h3 class="font-semibold">{state.recipientUsername}</h3>
              <div class="ml-auto text-xs bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                {chatMessages.length} pesan
              </div>
            </div>
          </div>

          <!-- Messages -->
          <div bind:this={chatContainer} class="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
            {#if chatMessages.length === 0}
              <div class="flex items-center justify-center h-full" transition:fade>
                <div class="text-center bg-white dark:bg-gray-800 p-8 rounded-xl border shadow-sm">
                  <div class="text-4xl mb-4">💬</div>
                  <h3 class="text-lg font-semibold mb-2">Mulai Percakapan</h3>
                  <p class="mb-4">Kirim pesan pertama ke <span class="font-medium text-amber-500">{state.recipientUsername}</span></p>
                </div>
              </div>
            {:else}
              {#each chatMessages as message, index (message.id || index)}
                <div transition:fly="{{ y: 20, duration: 300, delay: index * 20 }}">
                  <ChatBubble
                    message={message.content}
                    isSender={message.type === 'sent'}
                    from={message.from || ''}
                    verificationStatus={message.verificationStatus}
                    messageId={message.id}
                    signedMessage={message.signedMessage}
                    on:reverify={handleReverify}
                    on:showDetails={handleShowDetails}
                    on:copy={() => {}}
                  />
                </div>
              {/each}
            {/if}
          </div>

          <!-- Input -->
          <div class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
            <InputMessage
              bind:message={state.messageText}
              recipientUsername={state.recipientUsername}
              placeholder="Ketik pesan Anda..."
              on:send={handleSendMessage}
              on:typing={() => {}}
            />
          </div>
        {:else}
          <!-- Welcome Screen -->
          <div class="flex-1 flex items-center justify-center p-8">
            <div class="text-center max-w-md" transition:fade>
              <div class="w-20 h-20 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">👋</div>
              <h2 class="text-2xl font-bold mb-4">Selamat datang, {state.username}!</h2>
              <p class="mb-6">Pilih kontak untuk memulai percakapan yang aman dan terenkripsi.</p>
              
              <div class="grid grid-cols-3 gap-4 text-sm">
                <div class="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                  <div class="text-2xl mb-2">🔒</div>
                  <div class="font-medium">Terenkripsi</div>
                </div>
                <div class="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                  <div class="text-2xl mb-2">⚡</div>
                  <div class="font-medium">Real-time</div>
                </div>
                <div class="p-4 bg-white dark:bg-gray-800 rounded-lg border">
                  <div class="text-2xl mb-2">✅</div>
                  <div class="font-medium">Terverifikasi</div>
                </div>
              </div>
              
              {#if !showSidebar}
                <button on:click={() => showSidebar = true} class="mt-6 px-6 py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600">
                  Lihat Kontak
                </button>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </main>
</div>

<!-- Settings Modal -->
{#if showSettings}
  <SettingsModal on:close={() => showSettings = false} />
{/if}

<!-- Signature Details Modal -->
{#if state.showVerificationDetails && state.selectedMessage}
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" on:click={closeModal}>
    <div class="bg-white dark:bg-gray-800 rounded-lg w-full max-w-lg border" on:click|stopPropagation>
      <div class="flex items-center justify-between p-4 border-b">
        <h3 class="font-semibold">Detail Tanda Tangan Digital</h3>
        <button on:click={closeModal} class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      
      <div class="p-4 space-y-4">
        <div class="space-y-2 text-sm">
          <div><strong>Dari:</strong> {state.selectedMessage.from || state.username}</div>
          <div><strong>Pesan:</strong> {state.selectedMessage.content}</div>
          <div><strong>Status:</strong> 
            <span class="font-medium">
              {state.selectedMessage.verificationStatus === 'verified' ? '✅ Terverifikasi' :
               state.selectedMessage.verificationStatus === 'failed' ? '❌ Gagal verifikasi' :
               state.selectedMessage.verificationStatus === 'verifying' ? '⏳ Sedang memverifikasi' :
               state.selectedMessage.verificationStatus === 'pending' ? '⏳ Menunggu verifikasi' :
               state.selectedMessage.type === 'sent' ? '📤 Pesan Terkirim' : '❓ Status tidak diketahui'}
            </span>
          </div>
        </div>
        
        {#if state.selectedMessage.signedMessage}
          <div class="space-y-3">
            <div>
              <h4 class="font-medium mb-2">Hash Pesan:</h4>
              <pre class="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs font-mono overflow-x-auto">{state.selectedMessage.signedMessage.message_hash}</pre>
            </div>
            <div>
              <h4 class="font-medium mb-2">Tanda Tangan Digital:</h4>
              <div class="space-y-2">
                <div>
                  <span class="text-xs font-medium text-gray-500">Komponen R:</span>
                  <pre class="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs font-mono overflow-x-auto">{state.selectedMessage.signedMessage.signature.r}</pre>
                </div>
                <div>
                  <span class="text-xs font-medium text-gray-500">Komponen S:</span>
                  <pre class="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs font-mono overflow-x-auto">{state.selectedMessage.signedMessage.signature.s}</pre>
                </div>
              </div>
            </div>
          </div>
        {/if}
        
        <div class="flex justify-center pt-2 space-x-3">
          {#if state.selectedMessage.type === 'received' && state.selectedMessage.id && state.selectedMessage.signedMessage}
            <button on:click={reverifyFromModal} class="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600">
              Verifikasi Ulang
            </button>
          {/if}
          <button on:click={copySignatureData} class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
            Salin Data Tanda Tangan
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}