<!-- src/routes/chat/+page.svelte (Clean & Concise) -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { chatState } from '$lib/chat/chatState';
  import { initializeChat, setupBeforeUnload, cleanupChat } from '$lib/chat/chatInitialization';
  import { loadConversation } from '$lib/chat/chatHandlers';
  import { sendSignedMessage, reverifyMessage } from '$lib/chat/messageActions';
  import { getVerificationIcon, getVerificationColor } from '$lib/chat/uiHelpers';
  import ContactList from '../../components/contactList.svelte';
  import ChatBubble from '../../components/chatBubble.svelte';
  import InputMessage from '../../components/inputMessage.svelte';
  import SettingsModal from '../../components/SettingsModal.svelte';

  let websocketService = initializeChat();
  let cleanupBeforeUnload: (() => void) | undefined;
  let showSettings = false;
  let isMobile = false;

  $: state = $chatState;
  $: hasSelectedContact = !!state.recipientUsername;

  function handleSelectContact(selectedUsername: string): void {
    if (selectedUsername !== state.recipientUsername) {
      loadConversation(websocketService, selectedUsername);
    }
  }

  function handleInputSend(event: CustomEvent<{ message: string }>): void {
    chatState.update(s => ({ ...s, messageText: event.detail.message }));
    sendSignedMessage(websocketService);
  }

  function handleBubbleReverify(event: CustomEvent<{ messageId: string }>): void {
    const message = state.messages.find(msg => msg.id === event.detail.messageId);
    if (message) reverifyMessage(websocketService, message);
  }

  function handleBubbleShowDetails(event: CustomEvent<{ messageId: string }>): void {
    const message = state.messages.find(msg => msg.id === event.detail.messageId);
    if (message) {
      chatState.update(s => ({ ...s, selectedMessage: message, showVerificationDetails: true }));
    }
  }

  function handleBackToContacts(): void {
    chatState.update(s => ({ ...s, recipientUsername: '', messages: [] }));
  }

  function handleLogout(): void {
    if (browser) {
      ['username', 'user_id', 'ecdsa_private_key'].forEach(key => localStorage.removeItem(key));
      document.cookie = 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
      sessionStorage.clear();
      goto('/login');
    }
  }

  function checkMobile(): void {
    isMobile = window.innerWidth < 768;
  }

  onMount(() => {
    cleanupBeforeUnload = setupBeforeUnload();
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  });

  onDestroy(() => {
    cleanupChat(websocketService);
    cleanupBeforeUnload?.();
  });
</script>

<svelte:head>
  <title>{hasSelectedContact ? `Chat dengan ${state.recipientUsername} - ngobronline` : 'Chat - ngobronline'}</title>
</svelte:head>

<div class="h-screen flex flex-col bg-background text-text">
  <!-- Header -->
  <header class="flex items-center justify-between p-4 bg-surface border-b border-border">
    <div class="flex items-center gap-4">
      <h1 class="text-xl font-bold text-primary">ngobronline</h1>
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 rounded-full {state.connectionStatus === 'Connected to server' ? 'bg-success animate-pulse' : 'bg-error'}"></div>
        <span class="text-sm text-text-secondary">{state.connectionStatus}</span>
      </div>
    </div>
    
    <div class="flex items-center gap-3">
      <span class="hidden sm:block text-sm font-medium">{state.username}</span>
      <div class="w-8 h-8 rounded-full bg-primary text-primary-text flex items-center justify-center font-semibold">
        {state.username.charAt(0).toUpperCase()}
      </div>
      <button class="btn btn-ghost p-2" on:click={() => showSettings = true} title="Pengaturan">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      </button>
      <button class="btn btn-ghost p-2" on:click={handleLogout} title="Keluar">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
        </svg>
      </button>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 overflow-hidden relative">
    {#if state.loadingUsername}
      <div class="flex items-center justify-center h-full">
        <div class="text-center">
          <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-text-secondary">Memuat informasi pengguna...</p>
        </div>
      </div>
    {:else if !state.username}
      <div class="flex items-center justify-center h-full">
        <div class="text-center">
          <p class="text-error">Tidak dalam keadaan login.</p>
          <p class="text-text-muted text-sm mt-2">Mengalihkan ke halaman login...</p>
        </div>
      </div>
    {:else}
      <!-- Layout Container -->
      <div class="h-full transition-all duration-500 ease-out {hasSelectedContact ? 'grid grid-cols-[320px_1fr]' : 'flex justify-center'}">
        <!-- Contacts Panel -->
        <div class="bg-surface border border-border {hasSelectedContact ? 'rounded-none border-r h-full' : 'rounded-lg shadow-lg w-96 max-w-md h-full'} transition-all duration-500 ease-out">
          <ContactList 
            currentUsername={state.username}
            selectedContact={state.recipientUsername}
            onSelectContact={handleSelectContact}
          />
        </div>

        <!-- Chat Panel -->
        {#if hasSelectedContact}
          <div class="flex flex-col bg-background animate-fadeIn">
            <!-- Chat Header -->
            <div class="flex items-center gap-3 p-4 bg-surface border-b border-border">
              {#if isMobile}
                <button class="btn btn-ghost p-2" on:click={handleBackToContacts}>
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
              {/if}
              <div class="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-semibold">
                {state.recipientUsername.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 class="font-semibold">{state.recipientUsername}</h2>
                <p class="text-sm text-success">Online</p>
              </div>
            </div>

            <!-- Messages -->
            <div class="flex-1 overflow-y-auto p-4 space-y-4">
              {#each state.messages as message (message.id || `${message.timestamp}-${Math.random()}`)}
                {#if ['system', 'error', 'delivered', 'saved'].includes(message.type)}
                  <div class="text-center">
                    <span class="text-xs px-3 py-1 rounded-full {
                      message.type === 'system' ? 'bg-surface-hover text-text-muted' :
                      message.type === 'error' ? 'bg-error text-white' :
                      message.type === 'delivered' ? 'bg-success text-white' :
                      'bg-warning text-white'
                    }">
                      {message.type === 'error' ? '❌ ' : message.type === 'delivered' ? '✓ ' : message.type === 'saved' ? '💾 ' : ''}{message.content}
                    </span>
                  </div>
                {:else}
                  <ChatBubble
                    message={message.content}
                    time={message.timestamp}
                    isSender={message.type === 'sent'}
                    from={message.from || ''}
                    verificationStatus={message.verificationStatus}
                    messageId={message.id}
                    on:reverify={handleBubbleReverify}
                    on:showDetails={handleBubbleShowDetails}
                    on:copy={() => {}}
                  />
                {/if}
              {/each}

              {#if state.messages.length === 0}
                <div class="flex items-center justify-center h-full text-center">
                  <div>
                    <div class="text-4xl mb-4 opacity-50">💬</div>
                    <h3 class="text-lg font-semibold mb-2">Mulai percakapan</h3>
                    <p class="text-text-muted">Kirim pesan pertama Anda ke {state.recipientUsername}</p>
                  </div>
                </div>
              {/if}
            </div>

            <!-- Input -->
            <div class="p-4 bg-surface border-t border-border">
              <InputMessage
                bind:message={state.messageText}
                disabled={!state.recipientUsername}
                recipientUsername={state.recipientUsername}
                on:send={handleInputSend}
                on:typing={() => {}}
              />
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
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" on:click={() => chatState.update(s => ({ ...s, showVerificationDetails: false }))}>
    <div class="bg-surface border border-border rounded-lg w-full max-w-lg" on:click|stopPropagation>
      <div class="flex items-center justify-between p-4 border-b border-border">
        <h3 class="font-semibold">Detail Verifikasi</h3>
        <button class="btn btn-ghost p-1" on:click={() => chatState.update(s => ({ ...s, showVerificationDetails: false }))}>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="p-4 space-y-4">
        <div class="flex items-center gap-2">
          <span class="font-medium">Status:</span>
          <span class="{getVerificationColor(state.selectedMessage.verificationStatus)}">
            {getVerificationIcon(state.selectedMessage.verificationStatus)} {state.selectedMessage.verificationStatus}
          </span>
        </div>
        <div class="space-y-2 text-sm">
          <div><strong>Dari:</strong> {state.selectedMessage.from}</div>
          <div><strong>Pesan:</strong> {state.selectedMessage.content}</div>
          <div><strong>Waktu:</strong> {state.selectedMessage.timestamp}</div>
        </div>
        {#if state.selectedMessage.signedMessage}
          <div>
            <h4 class="font-medium mb-2">Hash Pesan:</h4>
            <pre class="bg-surface-hover p-3 rounded text-xs font-mono overflow-x-auto">{state.selectedMessage.signedMessage.message_hash}</pre>
          </div>
        {/if}
        <div class="flex justify-center pt-2">
          <button class="btn btn-primary" on:click={() => state.selectedMessage && handleBubbleReverify({ detail: { messageId: state.selectedMessage.id! } } as CustomEvent<{ messageId: string }>)}>
            Verifikasi Ulang
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes fadeIn {
    from { opacity: 0; transform: translateX(1rem); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out;
  }

  @media (prefers-reduced-motion: reduce) {
    .transition-all, .animate-fadeIn { 
      transition: none; 
      animation: none; 
    }
  }
</style>