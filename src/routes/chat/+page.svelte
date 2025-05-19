<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { fly, fade } from 'svelte/transition';
  
  import { chatState } from '$lib/chat/chatState';
  import { initializeChat, cleanupChat } from '$lib/chat/chatInitialization';
  import { loadConversation } from '$lib/chat/chatHandlers';
  import { sendSignedMessage, reverifyMessage } from '$lib/chat/messageActions';
  
  import ContactList from '../../components/contactList.svelte';
  import ChatBubble from '../../components/chatBubble.svelte';
  import InputMessage from '../../components/inputMessage.svelte';
  import SettingsModal from '../../components/SettingsModal.svelte';

  let websocketService = initializeChat();
  let showSettings = false;
  let showSidebar = true;
  let isMobile = false;
  let chatContainer: HTMLDivElement;

  $: state = $chatState;
  $: hasContact = !!state.recipientUsername;
  $: isConnected = state.connectionStatus === 'Connected to server';
  
  $: chatMessages = state.messages.filter(msg => {
    if (msg.type === 'sent') return msg.to === state.recipientUsername;
    if (msg.type === 'received') return msg.from === state.recipientUsername;
    return false;
  });

  const checkMobile = () => {
    isMobile = window.innerWidth < 768;
    if (isMobile && hasContact) showSidebar = false;
  };

  const handleSelectContact = (username: string) => {
    loadConversation(websocketService, username);
    if (isMobile) showSidebar = false;
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
    ['username', 'user_id', 'ecdsa_private_key'].forEach(key => localStorage.removeItem(key));
    goto('/login');
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

<div class="h-screen surface flex flex-col">
  <!-- Header -->
  <header class="surface border-b border p-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <button on:click={() => showSidebar = !showSidebar} class="md:hidden btn btn-ghost p-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <h1 class="text-xl font-bold accent">ngobronline</h1>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full animate-pulse {isConnected ? 'success' : 'error'}"></div>
          <span class="text-sm text-secondary">{state.connectionStatus}</span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="hidden sm:block text-sm font-medium">{state.username}</span>
        <div class="w-8 h-8 primary rounded-full flex items-center justify-center font-semibold text-sm">
          {state.username?.charAt(0).toUpperCase() ?? '?'}
        </div>
        <button on:click={() => showSettings = true} class="btn btn-ghost p-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </button>
        <button on:click={handleLogout} class="btn btn-ghost p-2 error">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
        </button>
      </div>
    </div>
  </header>

  <!-- Main -->
  <main class="flex-1 flex overflow-hidden">
    {#if state.loadingUsername}
      <div class="flex-1 flex items-center justify-center">
        <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    {:else if !state.username}
      <div class="flex-1 flex items-center justify-center">
        <button on:click={() => goto('/login')} class="btn btn-primary">Ke halaman login</button>
      </div>
    {:else}
      <!-- Sidebar -->
      {#if showSidebar}
        <aside class="w-full md:w-80 surface border-r border" transition:fly="{{ x: -320, duration: 300 }}">
          <ContactList
            currentUsername={state.username}
            selectedContact={state.recipientUsername}
            onSelectContact={handleSelectContact}
          />
        </aside>
      {/if}

      <!-- Chat -->
      <div class="flex-1 flex flex-col">
        {#if hasContact}
          <!-- Chat Header -->
          <div class="surface border-b border p-4">
            <div class="flex items-center gap-3">
              {#if isMobile}
                <button on:click={() => showSidebar = true} class="btn btn-ghost p-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
              {/if}
              <div class="w-10 h-10 primary rounded-full flex items-center justify-center font-semibold">
                {state.recipientUsername.charAt(0).toUpperCase()}
              </div>
              <h3 class="font-semibold">{state.recipientUsername}</h3>
              <div class="ml-auto text-xs surface-hover px-3 py-1 rounded-full text-secondary">
                {chatMessages.length} pesan
              </div>
            </div>
          </div>

          <!-- Messages -->
          <div bind:this={chatContainer} class="flex-1 overflow-y-auto p-4">
            {#if chatMessages.length === 0}
              <div class="flex items-center justify-center h-full" transition:fade>
                <div class="text-center card p-8">
                  <div class="text-4xl mb-4">💬</div>
                  <h3 class="text-lg font-semibold mb-2">Mulai Percakapan</h3>
                  <p class="text-secondary">Kirim pesan pertama ke <span class="accent font-medium">{state.recipientUsername}</span></p>
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
                    timestamp={message.timestamp}
                    on:reverify={handleReverify}
                    on:showDetails={handleShowDetails}
                    on:copy={() => {}}
                  />
                </div>
              {/each}
            {/if}
          </div>

          <!-- Input -->
          <div class="surface border-t border p-4">
            <InputMessage
              bind:message={state.messageText}
              recipientUsername={state.recipientUsername}
              on:send={handleSendMessage}
              on:typing={() => {}}
            />
          </div>
        {:else}
          <!-- Welcome -->
          <div class="flex-1 flex items-center justify-center p-8" transition:fade>
            <div class="text-center max-w-md">
              <div class="w-20 h-20 primary rounded-full flex items-center justify-center text-3xl mx-auto mb-6">👋</div>
              <h2 class="text-2xl font-bold mb-4">Selamat datang, {state.username}!</h2>
              <p class="mb-6 text-secondary">Pilih kontak untuk memulai percakapan yang aman.</p>
              <div class="grid grid-cols-3 gap-4 text-sm mb-6">
                <div class="card p-4">
                  <div class="text-2xl mb-2">🔒</div>
                  <div class="font-medium">Aman</div>
                </div>
                <div class="card p-4">
                  <div class="text-2xl mb-2">⚡</div>
                  <div class="font-medium">Cepat</div>
                </div>
                <div class="card p-4">
                  <div class="text-2xl mb-2">✅</div>
                  <div class="font-medium">Verified</div>
                </div>
              </div>
              {#if !showSidebar}
                <button on:click={() => showSidebar = true} class="btn btn-primary">Lihat Kontak</button>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </main>
</div>

<!-- Modals -->
{#if showSettings}
  <SettingsModal on:close={() => showSettings = false} />
{/if}

{#if state.showVerificationDetails && state.selectedMessage}
  <div class="modal-overlay" on:click={() => chatState.update(s => ({ ...s, showVerificationDetails: false }))}>
    <div class="modal-content max-w-lg" on:click|stopPropagation>
      <div class="flex items-center justify-between p-4 border-b border">
        <h3 class="font-semibold">Detail Tanda Tangan</h3>
        <button on:click={() => chatState.update(s => ({ ...s, showVerificationDetails: false }))} class="btn btn-ghost p-1">✕</button>
      </div>
      <div class="p-4 space-y-4">
        <div class="text-sm space-y-2">
          <div><strong>Dari:</strong> {state.selectedMessage.from || state.username}</div>
          <div><strong>Pesan:</strong> {state.selectedMessage.content}</div>
          <div><strong>Status:</strong> 
            {#if state.selectedMessage.verificationStatus === 'verified'}✅ Terverifikasi
            {:else if state.selectedMessage.verificationStatus === 'failed'}❌ Gagal
            {:else if state.selectedMessage.verificationStatus === 'verifying'}⏳ Memverifikasi
            {:else if state.selectedMessage.type === 'sent'}📤 Terkirim
            {:else}❓ Unknown{/if}
          </div>
        </div>
        {#if state.selectedMessage.signedMessage}
          <div>
            <h4 class="font-medium mb-2">Hash:</h4>
            <pre class="surface-hover p-2 rounded text-xs overflow-x-auto">{state.selectedMessage.signedMessage.message_hash}</pre>
            <h4 class="font-medium mb-2 mt-3">Signature:</h4>
            <div class="space-y-1">
              <div class="text-xs text-muted">R:</div>
              <pre class="surface-hover p-1 rounded text-xs overflow-x-auto">{state.selectedMessage.signedMessage.signature.r}</pre>
              <div class="text-xs text-muted">S:</div>
              <pre class="surface-hover p-1 rounded text-xs overflow-x-auto">{state.selectedMessage.signedMessage.signature.s}</pre>
            </div>
          </div>
          <div class="flex gap-2 pt-2">
            {#if state.selectedMessage.type === 'received' && state.selectedMessage.id}
              <button 
                on:click={() => { const msg = chatMessages.find(m => m.id === state.selectedMessage?.id); if (msg) reverifyMessage(websocketService, msg); }} 
                class="btn btn-primary text-sm">
                Verifikasi Ulang
              </button>
            {/if}
            <button 
              on:click={() => navigator.clipboard.writeText(JSON.stringify(state.selectedMessage?.signedMessage, null, 2))} 
              class="btn btn-secondary text-sm">
              Salin
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}