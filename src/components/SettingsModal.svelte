<!-- src/lib/components/SettingsModal.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { themeStore, type ThemeColor, type ThemeMode, themeConfigs } from '$lib/stores/themeStore';

  const dispatch = createEventDispatcher<{ close: void }>();

  let currentTheme = $themeStore;

  // Theme color options with Indonesian names
  const colorOptions: Array<{ value: ThemeColor; label: string; preview: string }> = [
    { value: 'amber', label: 'Amber', preview: '#f59e0b' },
    { value: 'crimson', label: 'Crimson', preview: '#dc2626' },
    { value: 'emerald', label: 'Emerald', preview: '#059669' },
    { value: 'azure', label: 'Azure', preview: '#2563eb' },
    { value: 'violet', label: 'Violet', preview: '#7c3aed' },
    { value: 'teal', label: 'Teal', preview: '#0891b2' }
  ];

  // Mode options
  const modeOptions: Array<{ value: ThemeMode; label: string; icon: string }> = [
    { value: 'dark', label: 'Mode Gelap', icon: '🌙' },
    { value: 'light', label: 'Mode Terang', icon: '☀️' }
  ];

  function handleColorChange(color: ThemeColor) {
    currentTheme = { ...currentTheme, color };
    themeStore.setColor(color);
  }

  function handleModeChange(mode: ThemeMode) {
    currentTheme = { ...currentTheme, mode };
    themeStore.setMode(mode);
  }

  function handleClose() {
    dispatch('close');
  }

  function resetToDefault() {
    themeStore.setTheme({ mode: 'dark', color: 'amber' });
    currentTheme = { mode: 'dark', color: 'amber' };
  }

  // Handle escape key
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }

  // Handle overlay click
  function handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Modal overlay -->
<div 
  class="fixed inset-0 z-50 flex items-center justify-center modal-overlay"
  on:click={handleOverlayClick}
  on:keydown={handleKeydown}
  role="dialog"
  aria-modal="true"
  aria-labelledby="settings-title"
>
  <!-- Modal content -->
  <div class="w-full max-w-md mx-4 modal-content">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border" style="border-color: var(--color-border)">
      <h2 id="settings-title" class="text-lg font-semibold">
        ⚙️ Pengaturan
      </h2>
      <button 
        on:click={handleClose}
        class="btn btn-ghost p-2 rounded-lg"
        aria-label="Tutup pengaturan"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- Content -->
    <div class="p-4 space-y-6">
      <!-- Theme Mode Section -->
      <div>
        <h3 class="text-sm font-medium mb-3 text-secondary">Mode Tampilan</h3>
        <div class="grid grid-cols-2 gap-2">
          {#each modeOptions as option}
            <button
              class="btn p-3 rounded-lg transition-all {currentTheme.mode === option.value ? 'btn-primary' : 'btn-ghost'}"
              on:click={() => handleModeChange(option.value)}
            >
              <span class="text-lg">{option.icon}</span>
              <span class="text-sm">{option.label}</span>
            </button>
          {/each}
        </div>
      </div>

      <!-- Theme Color Section -->
      <div>
        <h3 class="text-sm font-medium mb-3 text-secondary">Warna Tema</h3>
        <div class="grid grid-cols-3 gap-2">
          {#each colorOptions as option}
            <button
              class="btn p-3 rounded-lg transition-all flex flex-col items-center gap-2 {currentTheme.color === option.value ? 'btn-primary' : 'btn-ghost'}"
              on:click={() => handleColorChange(option.value)}
            >
              <div 
                class="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                style="background-color: {option.preview}"
              ></div>
              <span class="text-xs">{option.label}</span>
            </button>
          {/each}
        </div>
      </div>

      <!-- Preview Section -->
      <div class="border-t border pt-4" style="border-color: var(--color-border)">
        <h3 class="text-sm font-medium mb-3 text-secondary">Pratinjau</h3>
        <div class="card p-3 space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-sm">Tema Saat Ini:</span>
            <span class="text-sm font-medium">{themeConfigs[currentTheme.color][currentTheme.mode].displayName}</span>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-primary text-xs px-2 py-1">Primary</button>
            <button class="btn btn-secondary text-xs px-2 py-1">Secondary</button>
            <button class="btn btn-ghost text-xs px-2 py-1">Ghost</button>
          </div>
          <div class="text-xs text-muted">
            Ini adalah contoh bagaimana tema akan terlihat.
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="flex justify-between items-center p-4 border-t border" style="border-color: var(--color-border)">
      <button 
        on:click={resetToDefault}
        class="btn btn-ghost text-sm"
      >
        🔄 Reset ke Default
      </button>
      <button 
        on:click={handleClose}
        class="btn btn-primary"
      >
        Selesai
      </button>
    </div>
  </div>
</div>

<style>
  /* Additional modal-specific styles */
  .modal-overlay {
    animation: fadeIn 0.2s ease-out;
  }

  .modal-content {
    animation: slideIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
</style>