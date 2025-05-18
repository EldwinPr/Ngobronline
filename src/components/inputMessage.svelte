<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let message = "";
  export let disabled = false;
  export let placeholder = "Ketik pesan Anda...";
  export let maxLength = 2000;
  export let isTyping = false;
  export let recipientUsername = "";

  const dispatch = createEventDispatcher<{
    send: { message: string };
    typing: { isTyping: boolean };
    focus: void;
    blur: void;
  }>();

  let textareaElement: HTMLTextAreaElement;
  let isComposing = false;
  let characterCount = 0;
  let typingTimer: NodeJS.Timeout;

  // Handle input changes
  function handleInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    message = target.value;
    characterCount = message.length;
    
    // Auto-resize textarea
    autoResize(target);
    
    // Handle typing indicator
    handleTypingIndicator();
  }

  // Auto-resize textarea based on content
  function autoResize(textarea: HTMLTextAreaElement) {
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120); // Max height of ~4 lines
    textarea.style.height = newHeight + 'px';
  }

  // Handle typing indicator logic
  function handleTypingIndicator() {
    if (!isTyping && message.trim()) {
      isTyping = true;
      dispatch('typing', { isTyping: true });
    }

    // Clear existing timer
    if (typingTimer) {
      clearTimeout(typingTimer);
    }

    // Set new timer to stop typing indicator
    typingTimer = setTimeout(() => {
      if (isTyping) {
        isTyping = false;
        dispatch('typing', { isTyping: false });
      }
    }, 1000);
  }

  // Handle keyboard events
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey && !isComposing) {
      event.preventDefault();
      sendMessage();
    }
    
    // Handle Escape to blur
    if (event.key === 'Escape') {
      textareaElement.blur();
    }
  }

  // Handle composition events (for IME input)
  function handleCompositionStart() {
    isComposing = true;
  }

  function handleCompositionEnd() {
    isComposing = false;
  }

  // Handle focus events
  function handleFocus() {
    dispatch('focus');
  }

  function handleBlur() {
    dispatch('blur');
    // Stop typing indicator when unfocused
    if (isTyping) {
      isTyping = false;
      dispatch('typing', { isTyping: false });
    }
  }

  // Send message
  function sendMessage() {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      dispatch('send', { message: trimmedMessage });
      message = "";
      characterCount = 0;
      
      // Reset textarea height
      if (textareaElement) {
        textareaElement.style.height = 'auto';
      }
      
      // Stop typing indicator
      if (isTyping) {
        isTyping = false;
        dispatch('typing', { isTyping: false });
      }
    }
  }

  // Focus textarea programmatically
  export function focus() {
    if (textareaElement) {
      textareaElement.focus();
    }
  }

  // Clear message programmatically
  export function clear() {
    message = "";
    characterCount = 0;
    if (textareaElement) {
      textareaElement.style.height = 'auto';
    }
  }

  // Reactive updates
  $: characterCount = message.length;
  $: isNearLimit = characterCount > maxLength * 0.8;
  $: isOverLimit = characterCount > maxLength;
  $: canSend = message.trim().length > 0 && !disabled && !isOverLimit;

  // Cleanup on destroy
  import { onDestroy } from 'svelte';
  onDestroy(() => {
    if (typingTimer) {
      clearTimeout(typingTimer);
    }
  });
</script>

<div class="input-message-container">
  <!-- Typing indicator (if needed) -->
  {#if recipientUsername && isTyping}
    <div class="typing-indicator">
      <span class="typing-text">Anda sedang mengetik...</span>
    </div>
  {/if}

  <!-- Main input area -->
  <div class="input-wrapper">
    <!-- Textarea -->
    <div class="textarea-wrapper">
      <textarea
        bind:this={textareaElement}
        bind:value={message}
        {placeholder}
        {disabled}
        maxlength={maxLength}
        rows="1"
        class="message-textarea"
        class:disabled
        class:near-limit={isNearLimit}
        class:over-limit={isOverLimit}
        on:input={handleInput}
        on:keydown={handleKeydown}
        on:compositionstart={handleCompositionStart}
        on:compositionend={handleCompositionEnd}
        on:focus={handleFocus}
        on:blur={handleBlur}
      ></textarea>
      
      <!-- Character counter -->
      {#if characterCount > 0}
        <div class="character-counter" class:near-limit={isNearLimit} class:over-limit={isOverLimit}>
          {characterCount}/{maxLength}
        </div>
      {/if}
    </div>

    <!-- Action buttons -->
    <div class="action-buttons">
      <!-- Attachment button (placeholder for future) -->
      <!-- 
      <button 
        class="action-btn attachment-btn"
        title="Lampirkan file"
        disabled={disabled}
      >
        <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
        </svg>
      </button>
      -->

      <!-- Send button -->
      <button 
        class="send-btn"
        class:enabled={canSend}
        class:disabled={!canSend}
        {disabled}
        on:click={sendMessage}
        title={canSend ? 'Kirim pesan (Enter)' : 'Ketik pesan untuk mengirim'}
      >
        <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
        </svg>
        <span class="send-text">Kirim</span>
      </button>
    </div>
  </div>

  <!-- Help text -->
  <div class="help-text">
    <span class="shortcut-hint">Tekan Enter untuk kirim, Shift+Enter untuk baris baru</span>
    {#if recipientUsername}
      <span class="recipient-hint">Mengirim ke: <strong>{recipientUsername}</strong></span>
    {/if}
  </div>
</div>

<style>
  .input-message-container {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 0.75rem;
    box-shadow: 0 2px 8px var(--color-shadow);
    padding: 1rem;
    transition: all 0.2s ease;
  }

  .input-message-container:focus-within {
    border-color: var(--color-primary);
    box-shadow: 0 2px 12px var(--color-shadow), 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .typing-indicator {
    margin-bottom: 0.5rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.5rem;
    background-color: var(--color-surface-hover);
  }

  .typing-text {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    font-style: italic;
  }

  .input-wrapper {
    display: flex;
    gap: 0.75rem;
    align-items: flex-end;
  }

  .textarea-wrapper {
    flex: 1;
    position: relative;
  }

  .message-textarea {
    width: 100%;
    min-height: 2.5rem;
    max-height: 7.5rem;
    padding: 0.75rem 1rem;
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    background-color: var(--color-surface);
    color: var(--color-text);
    font-family: inherit;
    font-size: 0.875rem;
    line-height: 1.5;
    resize: none;
    transition: all 0.2s ease;
    outline: none;
  }

  .message-textarea::placeholder {
    color: var(--color-text-muted);
  }

  .message-textarea:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .message-textarea.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: var(--color-surface-hover);
  }

  .message-textarea.near-limit {
    border-color: var(--color-warning);
  }

  .message-textarea.over-limit {
    border-color: var(--color-error);
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  }

  .character-counter {
    position: absolute;
    bottom: 0.5rem;
    right: 0.75rem;
    font-size: 0.7rem;
    color: var(--color-text-muted);
    pointer-events: none;
    transition: color 0.2s ease;
  }

  .character-counter.near-limit {
    color: var(--color-warning);
  }

  .character-counter.over-limit {
    color: var(--color-error);
    font-weight: 600;
  }

  .action-buttons {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .action-btn {
    padding: 0.5rem;
    border: 1px solid var(--color-border);
    border-radius: 0.5rem;
    background-color: var(--color-surface);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .action-btn:hover:not(:disabled) {
    background-color: var(--color-surface-hover);
    border-color: var(--color-border-hover);
    color: var(--color-text);
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .send-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.5rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 5rem;
  }

  .send-btn.enabled {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
    color: var(--color-primary-text);
    transform: scale(1);
  }

  .send-btn.enabled:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px var(--color-shadow);
  }

  .send-btn.enabled:active {
    transform: scale(0.98);
  }

  .send-btn.disabled {
    background-color: var(--color-surface-hover);
    color: var(--color-text-muted);
    cursor: not-allowed;
    border: 1px solid var(--color-border);
  }

  .btn-icon {
    width: 1.25rem;
    height: 1.25rem;
    flex-shrink: 0;
  }

  .send-text {
    font-size: 0.875rem;
  }

  .help-text {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.5rem;
    font-size: 0.7rem;
    color: var(--color-text-muted);
  }

  .shortcut-hint {
    opacity: 0.8;
  }

  .recipient-hint {
    font-weight: 500;
  }

  .recipient-hint strong {
    color: var(--color-primary);
  }

  /* Responsive design */
  @media (max-width: 640px) {
    .input-message-container {
      padding: 0.75rem;
    }

    .input-wrapper {
      gap: 0.5rem;
    }

    .send-btn {
      padding: 0.75rem 1rem;
      min-width: auto;
    }

    .send-text {
      display: none;
    }

    .help-text {
      flex-direction: column;
      gap: 0.25rem;
      align-items: flex-start;
    }
  }

  /* Animation for send button */
  @keyframes buttonPulse {
    0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
    100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
  }

  .send-btn.enabled:focus {
    animation: buttonPulse 0.6s ease-out;
  }
</style>