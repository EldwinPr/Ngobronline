<script lang="ts">
  import { generateKeyPair } from '$lib/chat/keyDerivation';
  import { goto } from '$app/navigation';

  let username = '';
  let password = '';
  let error = '';
  let loading = false;
  let showPassword = false;

  async function handleLogin(event: Event) {
    event.preventDefault();
    error = '';
    loading = true;

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Login gagal.');
      }

      // Generate private key if not exists
      let privateKey = localStorage.getItem('ecdsa_private_key');
      if (!privateKey) {
        const keyPair = await generateKeyPair(username, password);
        privateKey = JSON.stringify(keyPair.privateKey);
        localStorage.setItem('ecdsa_private_key', privateKey);
      }

      localStorage.setItem('username', result.user.username);
      localStorage.setItem('user_id', result.user.id);

      goto('/chat');
    } catch (err: any) {
      error = err?.message || 'Login gagal.';
    } finally {
      loading = false;
    }
  }

  function goToRegister() {
    goto('/register');
  }

  function goToHome() {
    goto('/');
  }
</script>

<svelte:head>
  <title>Masuk - ngobronline</title>
</svelte:head>

<div class="min-h-screen flex">
  <!-- Left Side - Form -->
  <div class="flex-1 flex items-center justify-center p-8 bg-surface">
    <div class="w-full max-w-md space-y-8">
      <!-- Header -->
      <div class="text-center">
        <button 
          on:click={goToHome}
          class="inline-flex items-center gap-2 text-accent hover:text-primary transition-colors mb-6"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Kembali ke Beranda
        </button>
        
        <h2 class="text-3xl font-bold text-center mb-2">
          Selamat Datang Kembali! 👋
        </h2>
        <p class="text-secondary text-center">
          Masuk ke akun ngobronline Anda
        </p>
      </div>

      <!-- Form -->
      <form on:submit={handleLogin} class="space-y-6">
        <!-- Username Field -->
        <div class="space-y-2">
          <label for="username" class="block text-sm font-medium">
            Username
          </label>
          <div class="relative">
            <input
              id="username"
              type="text"
              bind:value={username}
              required
              minlength="3"
              maxlength="30"
              class="input w-full pl-10"
              placeholder="Masukkan username Anda"
            />
          </div>
        </div>

        <!-- Password Field -->
        <div class="space-y-2">
          <label for="password" class="block text-sm font-medium">
            Password
          </label>
          <div class="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              bind:value={password}
              required
              minlength="8"
              maxlength="100"
              class="input w-full pl-10 pr-10"
              placeholder="Masukkan password Anda"
            />
            <button
              type="button"
              on:click={() => showPassword = !showPassword}
              class="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {#if showPassword}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="m1 1 22 22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              {:else}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                </svg>
              {/if}
            </button>
          </div>
        </div>

        <!-- Error Message -->
        {#if error}
          <div class="p-3 rounded-lg bg-red-50 border border-red-200">
            <p class="text-red-700 text-sm">❌ {error}</p>
          </div>
        {/if}

        <!-- Submit Button -->
        <button
          type="submit"
          disabled={loading || !username || !password}
          class="btn btn-primary w-full py-3 text-lg font-medium"
        >
          {#if loading}
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sedang masuk...
          {:else}
            🚀 Masuk Sekarang
          {/if}
        </button>

        <!-- Register Link -->
        <div class="text-center">
          <p class="text-sm text-secondary">
            Belum punya akun?
            <button
              type="button"
              on:click={goToRegister}
              class="font-medium text-accent hover:text-primary transition-colors"
            >
              Daftar sekarang
            </button>
          </p>
        </div>
      </form>
    </div>
  </div>

  <!-- Right Side - Visual -->
  <div class="hidden lg:flex flex-1 relative overflow-hidden">
    <!-- Background with Pattern -->
    <div class="absolute inset-0 bg-gradient-to-br from-primary to-primary-hover"></div>
    
    <!-- Animated Background Pattern -->
    <div class="absolute inset-0 opacity-10">
      <div class="absolute top-0 left-0 w-full h-full">
        <div class="grid grid-cols-8 gap-4 h-full p-8 transform rotate-12">
          {#each Array(64) as _, i}
            <div 
              class="bg-white rounded-lg opacity-20"
              style="animation-delay: {i * 0.1}s"
              class:animate-pulse={i % 3 === 0}
            ></div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="relative z-10 flex items-center justify-center text-white p-12">
      <div class="text-center space-y-6 max-w-md">
        <div class="text-6xl mb-6">🔐</div>
        <h3 class="text-3xl font-bold">Login Aman</h3>
        <p class="text-lg opacity-90">
          Enkripsi end-to-end melindungi setiap percakapan Anda
        </p>
        <div class="space-y-4 pt-8">
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <span class="text-primary text-sm">✓</span>
            </div>
            <span>Tanda tangan digital untuk setiap pesan</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <span class="text-primary text-sm">✓</span>
            </div>
            <span>Private key tersimpan lokal</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <span class="text-primary text-sm">✓</span>
            </div>
            <span>Zero-knowledge architecture</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* Input field animations */
  .input {
    transition: all 0.3s ease;
  }
  
  .input:focus {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  /* Loading spinner animation */
  .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Background pattern animation */
  .animate-pulse {
    animation: pulse 2s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 0.1;
    }
    50% {
      opacity: 0.3;
    }
  }

  /* Mobile responsiveness */
  @media (max-width: 1024px) {
    .min-h-screen {
      background: var(--color-surface);
    }
  }
</style>