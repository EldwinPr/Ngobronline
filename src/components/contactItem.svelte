<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let name = "";
  export let selected = false;
  export let online = false; // Future feature for online status
  export let unreadCount = 0; // Future feature for unread messages
  export let lastSeen = ""; // Future feature for last seen time
  export let avatar = ""; // Future feature for custom avatars
  export let disabled = false;

  const dispatch = createEventDispatcher<{
    click: { name: string };
    contextmenu: { name: string; event: MouseEvent };
  }>();

  // Generate avatar color based on name
  function getAvatarColor(contactName: string): string {
    const colors = [
      'var(--color-primary)',
      'var(--color-accent)', 
      '#ef4444', // red
      '#10b981', // emerald
      '#8b5cf6', // violet
      '#f59e0b', // amber
      '#06b6d4', // cyan
      '#ec4899', // pink
    ];
    
    const hash = contactName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  }

  // Format last seen time (for future use)
  function formatLastSeen(timestamp: string): string {
    if (!timestamp) return "";
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "Baru saja";
      if (diffMins < 60) return `${diffMins} menit lalu`;
      if (diffHours < 24) return `${diffHours} jam lalu`;
      if (diffDays === 1) return "Kemarin";
      if (diffDays < 7) return `${diffDays} hari lalu`;
      return date.toLocaleDateString('id-ID');
    } catch {
      return "";
    }
  }

  // Event handlers
  function handleClick() {
    if (!disabled) {
      dispatch('click', { name });
    }
  }

  function handleContextMenu(event: MouseEvent) {
    event.preventDefault();
    if (!disabled) {
      dispatch('contextmenu', { name, event });
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if ((event.key === 'Enter' || event.key === ' ') && !disabled) {
      event.preventDefault();
      dispatch('click', { name });
    }
  }

  // Reactive values
  $: avatarColor = getAvatarColor(name);
  $: initials = name.charAt(0).toUpperCase();
  $: formattedLastSeen = formatLastSeen(lastSeen);
</script>

<button
  class="contact-item"
  class:selected
  class:disabled
  class:online
  {disabled}
  on:click={handleClick}
  on:contextmenu={handleContextMenu}
  on:keydown={handleKeydown}
  role="button"
  tabindex={disabled ? -1 : 0}
  aria-label="Chat dengan {name}"
  aria-pressed={selected}
>
  <div class="contact-content">
    <!-- Avatar section -->
    <div class="avatar-section">
      <div class="avatar" style="background-color: {avatarColor}">
        {#if avatar}
          <img src={avatar} alt="{name} avatar" class="avatar-image" />
        {:else}
          <span class="avatar-text">{initials}</span>
        {/if}
      </div>
      
      <!-- Online status indicator -->
      {#if online}
        <div class="online-indicator" title="Online"></div>
      {/if}
    </div>

    <!-- Contact info -->
    <div class="contact-info">
      <div class="name-row">
        <h3 class="contact-name">{name}</h3>
        
        <!-- Unread badge -->
        {#if unreadCount > 0}
          <span class="unread-badge" title="{unreadCount} pesan belum dibaca">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        {/if}
      </div>
      
      <!-- Status/last seen -->
      <div class="contact-status">
        {#if online}
          <span class="status-online">Online</span>
        {:else if formattedLastSeen}
          <span class="status-offline">Terakhir dilihat {formattedLastSeen}</span>
        {:else}
          <span class="status-default">Klik untuk mulai chat</span>
        {/if}
      </div>
    </div>

    <!-- Selection indicator -->
    <div class="selection-indicator">
      {#if selected}
        <svg class="selection-icon selected-icon" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
      {:else}
        <svg class="selection-icon hover-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      {/if}
    </div>
  </div>

  <!-- Hover/focus effects -->
  <div class="contact-overlay"></div>
</button>

<style>
  .contact-item {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid transparent;
    border-radius: 0.5rem;
    background-color: transparent;
    color: inherit;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    text-align: left;
  }

  .contact-item:hover:not(.disabled) {
    background-color: var(--color-surface-hover);
    border-color: var(--color-border-hover);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px var(--color-shadow);
  }

  .contact-item:focus:not(.disabled) {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .contact-item.selected {
    background-color: var(--color-primary);
    background-image: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
    border-color: var(--color-primary);
    color: var(--color-primary-text);
    box-shadow: 0 2px 8px var(--color-shadow);
  }

  .contact-item.selected:hover:not(.disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px var(--color-shadow);
  }

  .contact-item.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }

  .contact-content {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    position: relative;
    z-index: 1;
  }

  .avatar-section {
    position: relative;
    flex-shrink: 0;
  }

  .avatar {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease;
  }

  .contact-item:hover .avatar {
    transform: scale(1.05);
  }

  .avatar-image {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }

  .avatar-text {
    color: white;
    font-weight: 600;
    font-size: 1rem;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .online-indicator {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 0.75rem;
    height: 0.75rem;
    background-color: var(--color-success);
    border: 2px solid var(--color-surface);
    border-radius: 50%;
    animation: onlinePulse 2s infinite;
  }

  @keyframes onlinePulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
  }

  .contact-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .name-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .contact-name {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: currentColor;
    truncate: true;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .unread-badge {
    background-color: var(--color-primary);
    color: var(--color-primary-text);
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.125rem 0.375rem;
    border-radius: 0.75rem;
    min-width: 1.25rem;
    text-align: center;
    animation: badgeBounce 0.3s ease-out;
  }

  .contact-item.selected .unread-badge {
    background-color: var(--color-primary-text);
    color: var(--color-primary);
  }

  @keyframes badgeBounce {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); }
  }

  .contact-status {
    font-size: 0.75rem;
    opacity: 0.8;
  }

  .status-online {
    color: var(--color-success);
    font-weight: 500;
  }

  .status-offline {
    color: currentColor;
  }

  .status-default {
    color: currentColor;
    opacity: 0.6;
  }

  .selection-indicator {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .selection-icon {
    width: 1.25rem;
    height: 1.25rem;
    transition: all 0.2s ease;
  }

  .selected-icon {
    color: currentColor;
    animation: checkmarkSlide 0.3s ease-out;
  }

  .hover-icon {
    color: var(--color-text-muted);
    opacity: 0;
    transform: translateX(-0.5rem);
  }

  .contact-item:hover .hover-icon {
    opacity: 1;
    transform: translateX(0);
  }

  @keyframes checkmarkSlide {
    0% {
      opacity: 0;
      transform: scale(0.5) rotate(-90deg);
    }
    100% {
      opacity: 1;
      transform: scale(1) rotate(0deg);
    }
  }

  .contact-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.05) 100%);
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
  }

  .contact-item:hover .contact-overlay {
    opacity: 1;
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .contact-item {
      padding: 0.625rem;
    }

    .avatar {
      width: 2.25rem;
      height: 2.25rem;
    }

    .contact-name {
      font-size: 0.875rem;
    }

    .contact-status {
      font-size: 0.7rem;
    }
  }

  /* Focus ring for accessibility */
  .contact-item:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }

  /* Reduced motion preferences */
  @media (prefers-reduced-motion: reduce) {
    .contact-item,
    .avatar,
    .selection-icon,
    .online-indicator,
    .unread-badge {
      animation: none;
      transition: none;
    }
    
    .contact-item:hover {
      transform: none;
    }
  }
</style>