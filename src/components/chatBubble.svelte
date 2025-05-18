<!-- src/components/chatBubble.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { VerificationStatus, SignedMessage } from '$lib/chat/types';

  export let message: string = "";
  export let isSender: boolean = false;
  export let from: string = "";
  export let verificationStatus: VerificationStatus | undefined = undefined;
  export let messageId: string | undefined = undefined;
  export let signedMessage: SignedMessage | undefined = undefined;
  export let timestamp: string = "";

  const dispatch = createEventDispatcher<{
    reverify: { messageId: string };
    showDetails: { messageId: string };
    copy: { message: string };
  }>();

  // Helper functions
  function getVerificationIcon(status?: VerificationStatus): string {
    switch (status) {
      case 'verified': return '✅';
      case 'failed': return '❌';
      case 'verifying': return '⏳';
      case 'pending': return '⏸️';
      default: return '';
    }
  }

  function getVerificationColor(status?: VerificationStatus): string {
    switch (status) {
      case 'verified': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'verifying': return 'text-blue-500';
      case 'pending': return 'text-yellow-500';
      default: return '';
    }
  }

  function formatTime(ts: string): string {
    if (!ts) return '';
    try {
      const date = new Date(ts);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '';
    }
  }

  // Event handlers
  function handleCopy() {
    navigator.clipboard.writeText(message);
    dispatch('copy', { message });
  }

  function handleShowDetails() {
    if (messageId) dispatch('showDetails', { messageId });
  }

  function handleReverify() {
    if (messageId) dispatch('reverify', { messageId });
  }

  // Check if message has signature
  $: hasSignature = !!signedMessage;
</script>

<div class="flex {isSender ? 'justify-end' : 'justify-start'} mb-3 group">
  <div class="max-w-xs md:max-w-md">
    <!-- Chat Bubble -->
    <div class="{isSender 
        ? 'bg-amber-500 text-white rounded-l-2xl rounded-tr-2xl rounded-br-md' 
        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border dark:border-gray-600 rounded-r-2xl rounded-tl-2xl rounded-bl-md'
      } p-3 shadow-sm hover:shadow-md transition-shadow">
      
      <!-- Message Text -->
      <p class="text-sm whitespace-pre-wrap break-words">{message}</p>
      
      <!-- Message Footer -->
      <div class="flex items-center justify-between mt-2 text-xs">
        <!-- Left side - Status and timestamp -->
        <div class="flex items-center gap-1">
          <!-- Verification status for received messages -->
          {#if !isSender && verificationStatus}
            <span class="{getVerificationColor(verificationStatus)}" title="Status verifikasi">
              {getVerificationIcon(verificationStatus)}
            </span>
          {/if}
          
          <!-- Timestamp -->
          {#if timestamp}
            <span class="opacity-60 text-xs">
              {formatTime(timestamp)}
            </span>
          {/if}
        </div>

        <!-- Right side - Action buttons -->
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <!-- Copy button -->
          <button 
            on:click={handleCopy}
            class="p-1 rounded hover:bg-black/10 {isSender ? 'hover:bg-white/20' : ''}"
            title="Salin pesan"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
          </button>
          
          <!-- Signature details button (only for received messages with signatures) -->
          {#if !isSender && messageId && hasSignature}
            <button 
              on:click={handleShowDetails}
              class="p-1 rounded hover:bg-black/10"
              title="Detail tanda tangan"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </button>
          {/if}
          
          <!-- Reverify button (only for received messages with signatures) -->
          {#if !isSender && messageId && hasSignature}
            <button 
              on:click={handleReverify}
              class="p-1 rounded hover:bg-black/10"
              title="Verifikasi ulang"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </button>
          {/if}
        </div>
      </div>
    </div>
    
    <!-- Sender name for received messages -->
    {#if !isSender && from}
      <div class="text-xs text-gray-500 mt-1 ml-3">{from}</div>
    {/if}
  </div>
</div>

<!-- Mobile: Always show actions -->
<style>
  @media (max-width: 640px) {
    .group .opacity-0 {
      opacity: 1;
    }
  }
</style>