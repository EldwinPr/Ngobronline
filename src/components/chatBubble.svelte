<!-- src/components/chatBubble.svelte (Refactored) -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { VerificationStatus } from '$lib/chat/types';

  export let message = "";
  export let time = "";
  export let isSender = false;
  export let from = "";
  export let verificationStatus: VerificationStatus | undefined = undefined;
  export let isDelivered = false;
  export let isRead = false;
  export let messageId: string | undefined = undefined;

  const dispatch = createEventDispatcher<{
    reverify: { messageId: string };
    showDetails: { messageId: string };
    copy: { message: string };
  }>();

  // Format Indonesian timestamp
  function formatIndonesianTime(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      // If same day, show time
      if (diffDays === 0) {
        return date.toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      }
      // If yesterday
      else if (diffDays === 1) {
        return `Kemarin ${date.toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })}`;
      }
      // If within a week
      else if (diffDays < 7) {
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        return `${days[date.getDay()]} ${date.toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })}`;
      }
      // Older than a week
      else {
        return date.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }) + ' ' + date.toLocaleTimeString('id-ID', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        });
      }
    } catch (error) {
      // Fallback to original timestamp if parsing fails
      return timestamp;
    }
  }

  // Get verification status icon and color
  function getVerificationInfo(status?: VerificationStatus) {
    switch (status) {
      case 'verified':
        return { icon: '✓', color: 'var(--color-success)', label: 'Terverifikasi' };
      case 'failed':
        return { icon: '✗', color: 'var(--color-error)', label: 'Gagal verifikasi' };
      case 'verifying':
        return { icon: '⟳', color: 'var(--color-primary)', label: 'Memverifikasi...' };
      case 'pending':
        return { icon: '⧖', color: 'var(--color-warning)', label: 'Menunggu verifikasi' };
      default:
        return null;
    }
  }

  // Get delivery status info
  function getDeliveryInfo() {
    if (isRead) return { icon: '✓✓', color: 'var(--color-success)', label: 'Dibaca' };
    if (isDelivered) return { icon: '✓', color: 'var(--color-text-muted)', label: 'Terkirim' };
    return { icon: '⧖', color: 'var(--color-text-muted)', label: 'Mengirim...' };
  }

  // Event handlers
  function handleReverify() {
    if (messageId) {
      dispatch('reverify', { messageId });
    }
  }

  function handleShowDetails() {
    if (messageId) {
      dispatch('showDetails', { messageId });
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(message).then(() => {
      dispatch('copy', { message });
    }).catch(err => {
      console.error('Failed to copy message:', err);
    });
  }

  $: formattedTime = formatIndonesianTime(time);
  $: verificationInfo = getVerificationInfo(verificationStatus);
  $: deliveryInfo = isSender ? getDeliveryInfo() : null;
</script>

<div class="message-container" class:sender={isSender} class:receiver={!isSender}>
  <div class="bubble" class:sender-bubble={isSender} class:receiver-bubble={!isSender}>
    <!-- Message content -->
    <div class="message-content">
      <p class="message-text">{message}</p>
    </div>
    
    <!-- Message metadata -->
    <div class="message-meta">
      <div class="meta-left">
        <span class="timestamp">{formattedTime}</span>
        
        <!-- Verification status for received messages -->
        {#if !isSender && verificationInfo}
          <div class="verification-status" title={verificationInfo.label}>
            <span 
              class="verification-icon" 
              style="color: {verificationInfo.color}"
              class:animate-spin={verificationStatus === 'verifying'}
            >
              {verificationInfo.icon}
            </span>
          </div>
        {/if}
        
        <!-- Delivery status for sent messages -->
        {#if isSender && deliveryInfo}
          <div class="delivery-status" title={deliveryInfo.label}>
            <span style="color: {deliveryInfo.color}">
              {deliveryInfo.icon}
            </span>
          </div>
        {/if}
      </div>
      
      <!-- Message actions -->
      <div class="message-actions">
        <!-- Copy button -->
        <button 
          class="action-btn copy-btn"
          on:click={handleCopy}
          title="Salin pesan"
        >
          <svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
        </button>
        
        <!-- Verification actions for received messages -->
        {#if !isSender && verificationStatus && messageId}
          <button 
            class="action-btn reverify-btn"
            on:click={handleReverify}
            title="Verifikasi ulang"
          >
            <svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </button>
          
          <button 
            class="action-btn details-btn"
            on:click={handleShowDetails}
            title="Detail verifikasi"
          >
            <svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </button>
        {/if}
      </div>
    </div>
  </div>
  
  <!-- Sender name for received messages -->
  {#if !isSender && from}
    <div class="sender-name">{from}</div>
  {/if}
</div>

<style>
  .message-container {
    display: flex;
    flex-direction: column;
    margin-bottom: 1rem;
    max-width: 80%;
  }

  .message-container.sender {
    align-items: flex-end;
    margin-left: auto;
  }

  .message-container.receiver {
    align-items: flex-start;
    margin-right: auto;
  }

  .bubble {
    padding: 0.75rem 1rem;
    border-radius: 1rem;
    border: 1px solid var(--color-border);
    box-shadow: 0 1px 2px var(--color-shadow);
    position: relative;
    transition: all 0.2s ease;
  }

  .bubble:hover {
    box-shadow: 0 2px 8px var(--color-shadow);
  }

  .sender-bubble {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
    color: var(--color-primary-text);
    border-bottom-right-radius: 0.25rem;
  }

  .receiver-bubble {
    background-color: var(--color-surface);
    color: var(--color-text);
    border-bottom-left-radius: 0.25rem;
    border-color: var(--color-border);
  }

  .message-content {
    margin-bottom: 0.5rem;
  }

  .message-text {
    margin: 0;
    word-wrap: break-word;
    white-space: pre-wrap;
    line-height: 1.4;
  }

  .message-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .bubble:hover .message-meta {
    opacity: 1;
  }

  .meta-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
  }

  .timestamp {
    color: currentColor;
    opacity: 0.7;
    font-size: 0.65rem;
  }

  .verification-status,
  .delivery-status {
    display: flex;
    align-items: center;
  }

  .verification-icon {
    font-size: 0.75rem;
    font-weight: bold;
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .message-actions {
    display: flex;
    gap: 0.25rem;
  }

  .action-btn {
    padding: 0.25rem;
    border: none;
    background: transparent;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.2s ease;
    opacity: 0.7;
  }

  .action-btn:hover {
    opacity: 1;
    background-color: var(--color-surface-hover);
    transform: scale(1.1);
  }

  .sender-bubble .action-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .action-icon {
    width: 1rem;
    height: 1rem;
    color: currentColor;
  }

  .sender-name {
    font-size: 0.7rem;
    color: var(--color-text-muted);
    margin-top: 0.25rem;
    margin-left: 0.5rem;
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .message-container {
      max-width: 90%;
    }
    
    .bubble {
      padding: 0.625rem 0.875rem;
    }
    
    .message-meta {
      opacity: 1; /* Always visible on mobile */
    }
  }

  /* Animation for new messages */
  @keyframes messageSlideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .bubble {
    animation: messageSlideIn 0.3s ease-out;
  }
</style>