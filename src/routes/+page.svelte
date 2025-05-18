<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import SettingsModal from '../components/SettingsModal.svelte';

  let isLoggedIn = false;
  let username = '';
  let showSettings = false;

  // Check if user is logged in
  onMount(() => {
    if (browser) {
      const storedUsername = localStorage.getItem('username');
      const userId = localStorage.getItem('user_id');
      
      if (storedUsername && userId) {
        isLoggedIn = true;
        username = storedUsername;
      }
    }
  });

  function handleStartChat() {
    if (isLoggedIn) {
      goto('/chat');
    } else {
      goto('/register');
    }
  }

  function handleLogin() {
    goto('/login');
  }

  function handleSettings() {
    showSettings = true;
  }
</script>

<svelte:head>
  <title>ngobronline - Chat aman dengan tanda tangan digital</title>
</svelte:head>

<div class="min-h-screen flex">
  <!-- Left Side - Brand & Features -->
  <div class="hidden lg:flex flex-1 relative overflow-hidden">
    <!-- Background with Pattern -->
    <div class="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"></div>
    
    <!-- Animated Background Pattern -->
    <div class="absolute inset-0 opacity-10">
      <div class="absolute inset-0">
        <div class="grid grid-cols-8 gap-4 h-full p-8 transform rotate-12">
          {#each Array(64) as _, i}
            <div 
              class="bg-white rounded-lg opacity-20 transition-all duration-1000"
              style="animation-delay: {i * 0.05}s"
              class:animate-pulse={i % 5 === 0}
            ></div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="relative z-10 flex items-center justify-center text-white p-12 pl-48 min-h-full">
      <div class="space-y-8 max-w-md w-full">
        <div class="text-center">
          <h3 class="text-6xl font-bold">ngobronline</h3>
          <p class="text-xl opacity-90 leading-relaxed">
            Ngobrol online aman dengan tanda tangan digital
          </p>
        </div>
        <div class="space-y-6 pt-8">
          <div class="flex items-center gap-4">
            <div class="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <span class="text-indigo-600 text-sm font-bold">✓</span>
            </div>
            <span class="text-lg">Verifikasi tanda tangan digital</span>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <span class="text-indigo-600 text-sm font-bold">✓</span>
            </div>
            <span class="text-lg">Real-time messaging</span>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <span class="text-indigo-600 text-sm font-bold">✓</span>
            </div>
            <span class="text-lg">Zero-knowledge architecture</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Right Side - Welcome & CTA -->
  <div class="flex-1 flex items-center justify-center p-8" style="background-color: var(--color-surface)">
    <!-- Settings Button (Top Right Corner) -->
    <button 
      on:click={handleSettings}
      class="absolute top-6 right-6 w-10 h-10 rounded-full bg-white shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
      title="Pengaturan Tema"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-gray-600">
        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="currentColor" stroke-width="2"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" stroke-width="2"/>
      </svg>
    </button>

    <div class="w-full max-w-md space-y-8">
      <!-- Welcome Message -->
      <div class="text-center">
        <h2 class="text-4xl md:text-5xl font-bold mb-6" style="color: var(--color-text)">
          {#if isLoggedIn}
            Selamat datang kembali! 👋
          {:else}
            Selamat datang! 👋
          {/if}
        </h2>
        
        {#if isLoggedIn}
          <div class="mb-6">
            <div class="inline-flex items-center gap-3 px-6 py-3 rounded-full border-2 border-dashed" style="border-color: var(--color-primary);">
              <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background-color: var(--color-primary);">
                <span class="text-white font-bold">{username[0]?.toUpperCase()}</span>
              </div>
              <span class="font-semibold" style="color: var(--color-text)">Halo, {username}!</span>
            </div>
          </div>
          <p class="text-xl mb-2" style="color: var(--color-text-secondary)">
            Siap melanjutkan percakapan?
          </p>
        {:else}
          <p class="text-xl mb-2" style="color: var(--color-text-secondary)">
            Chat aman dengan teknologi terdepan
          </p>
          <p class="text-sm" style="color: var(--color-text-muted)">
            Daftar sekarang dan mulai percakapan yang terenkripsi
          </p>
        {/if}
      </div>

      <!-- CTA Buttons -->
      <div class="space-y-4">
        <button 
          on:click={handleStartChat}
          class="btn btn-primary w-full text-xl px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
        >
          {#if isLoggedIn}
            💬 Lanjut Chat
          {:else}
            🚀 Mulai Chat Sekarang
          {/if}
        </button>
        
        {#if !isLoggedIn}
          <div class="text-center">
            <p class="text-sm mb-3" style="color: var(--color-text-muted)">
              Sudah punya akun?
            </p>
            <button 
              on:click={handleLogin}
              class="btn btn-secondary px-8 py-3 rounded-full"
            >
              Masuk ke Akun
            </button>
          </div>
        {/if}
      </div>

      <!-- Features Summary -->
      <div class="border-t pt-6" style="border-color: var(--color-border)">
        <h4 class="font-semibold text-center mb-4" style="color: var(--color-text)">
          Mengapa ngobronline?
        </h4>
        <div class="grid grid-cols-2 gap-4 text-center">
          <div class="p-4 rounded-lg hover:shadow-md transition-shadow" style="background-color: var(--color-surface-hover);">
            <div class="text-2xl mb-2">🔒</div>
            <div class="text-sm font-medium" style="color: var(--color-text)">100% Aman</div>
            <div class="text-xs" style="color: var(--color-text-muted)">Chat yang mudah & aman</div>
          </div>
          <div class="p-4 rounded-lg hover:shadow-md transition-shadow" style="background-color: var(--color-surface-hover);">
            <div class="text-2xl mb-2">⚡</div>
            <div class="text-sm font-medium" style="color: var(--color-text)">Super Cepat</div>
            <div class="text-xs" style="color: var(--color-text-muted)">Real-time messaging</div>
          </div>
          <div class="p-4 rounded-lg hover:shadow-md transition-shadow" style="background-color: var(--color-surface-hover);">
            <div class="text-2xl mb-2">✅</div>
            <div class="text-sm font-medium" style="color: var(--color-text)">Terverifikasi</div>
            <div class="text-xs" style="color: var(--color-text-muted)">Digital signature</div>
          </div>
          <div class="p-4 rounded-lg hover:shadow-md transition-shadow" style="background-color: var(--color-surface-hover);">
            <div class="text-2xl mb-2">🆓</div>
            <div class="text-sm font-medium" style="color: var(--color-text)">Gratis</div>
            <div class="text-xs" style="color: var(--color-text-muted)">Selamanya</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Settings Modal -->
{#if showSettings}
  <SettingsModal on:close={() => showSettings = false} />
{/if}

<style>
  /* Background pattern animation */
  .animate-pulse {
    animation: pulse 3s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 0.1;
    }
    50% {
      opacity: 0.4;
    }
  }

  /* Enhanced button styles */
  .btn-primary {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
    border: none;
    color: white;
    font-weight: 600;
  }

  .btn-secondary {
    background: transparent;
    border: 2px solid var(--color-border);
    color: var(--color-text);
    font-weight: 500;
  }

  .btn-secondary:hover {
    background-color: var(--color-surface-hover);
    border-color: var(--color-border-hover);
  }

  /* Mobile responsiveness */
  @media (max-width: 1024px) {
    .min-h-screen {
      background: var(--color-surface);
    }
    
    /* Settings button adjustment on mobile */
    .absolute.top-6.right-6 {
      top: 1rem;
      right: 1rem;
    }
  }

  /* Smooth transitions */
  .transition-all {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
</style>