<!-- src/routes/register/+page.svelte -->
<script lang="ts">
  import { generateKeyPair } from '$lib/chat/keyDerivation';
  import { goto } from '$app/navigation';

  let username = '';
  let password = '';
  let confirmPassword = '';
  let error = '';
  let success = '';
  let loading = false;
  let showPassword = false;
  let showConfirmPassword = false;

  // Password strength indicators
  $: passwordStrength = getPasswordStrength(password);
  $: passwordsMatch = password && confirmPassword && password === confirmPassword;
  $: usernameValid = username.length >= 3 && username.length <= 30;

  function getPasswordStrength(pwd: string) {
    let score = 0;
    const checks = {
      length: pwd.length >= 8,
      lowercase: /[a-z]/.test(pwd),
      uppercase: /[A-Z]/.test(pwd),
      numbers: /\d/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    };
    
    score = Object.values(checks).filter(Boolean).length;
    
    return {
      score,
      checks,
      level: score <= 2 ? 'lemah' : score <= 3 ? 'sedang' : score <= 4 ? 'kuat' : 'sangat kuat',
      color: score <= 2 ? 'text-red-500' : score <= 3 ? 'text-orange-500' : score <= 4 ? 'text-blue-500' : 'text-green-500'
    };
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    error = '';
    success = '';

    if (password !== confirmPassword) {
      error = 'Password dan konfirmasi password tidak cocok.';
      return;
    }

    if (passwordStrength.score < 3) {
      error = 'Password terlalu lemah. Gunakan kombinasi huruf besar, kecil, angka, dan simbol.';
      return;
    }

    loading = true;

    try {
      const { publicKey, privateKey } = await generateKeyPair(username, password);
      const publicKeyString = JSON.stringify(publicKey);

      localStorage.setItem('ecdsa_private_key', JSON.stringify(privateKey));

      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, publicKeyString })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Registrasi gagal.');
      }

      success = 'Akun berhasil dibuat! Mengalihkan ke halaman login...';
      setTimeout(() => {
        goto('/login');
      }, 2000);
    } catch (err) {
      if (err instanceof Error) {
        error = err.message;
      } else {
        error = 'Registrasi gagal. Silakan coba lagi.';
      }
    } finally {
      loading = false;
    }
  }

  function goToLogin() {
    goto('/login');
  }

  function goToHome() {
    goto('/');
  }
</script>

<svelte:head>
  <title>Daftar - ngobronline</title>
</svelte:head>

<div class="min-h-screen flex">
  <!-- Left Side - Visual -->
  <div class="hidden lg:flex flex-1 relative overflow-hidden">
    <!-- Background with Pattern -->
    <div class="absolute inset-0 bg-gradient-to-br from-primary to-primary-hover"></div>
    
    <!-- Animated Background Pattern -->
    <div class="absolute inset-0 opacity-10">
      <div class="absolute top-0 left-0 w-full h-full">
        <div class="grid grid-cols-6 gap-4 h-full p-8 transform rotate-12">
          {#each Array(36) as _, i}
            <div 
              class="bg-white rounded-lg opacity-20"
              style="animation-delay: {i * 0.1}s"
              class:animate-pulse={i % 4 === 0}
            ></div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="relative z-10 flex items-center justify-center text-white p-12 pl-24">
      <div class="text-center space-y-6 max-w-md">
        <div class="text-6xl mb-6">🎯</div>
        <h3 class="text-3xl font-bold">Bergabung Sekarang</h3>
        <p class="text-lg opacity-90">
          Daftar akun dan mulai chat aman dengan teman-teman
        </p>
        <div class="space-y-4 pt-8">
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <span class="text-primary text-sm">✓</span>
            </div>
            <span>Gratis selamanya</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <span class="text-primary text-sm">✓</span>
            </div>
            <span>Tanpa iklan atau tracking</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <span class="text-primary text-sm">✓</span>
            </div>
            <span>Registrasi secepat kilat</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Right Side - Form -->
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
          Buat Akun Baru 🎉
        </h2>
        <p class="text-secondary text-center">
          Daftar sekarang dan mulai chat aman
        </p>
      </div>

      <!-- Form -->
      <form on:submit={handleSubmit} class="space-y-6">
        <!-- Username Field -->
        <div class="space-y-2">
          <label for="username" class="block text-sm font-medium">
            Username
            {#if usernameValid}
              <span class="text-green-500">✓</span>
            {/if}
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
              placeholder="Pilih username unik"
            />
          </div>
          <p class="text-xs text-muted">3-30 karakter, akan digunakan sebagai identitas Anda</p>
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
              placeholder="Buat password yang kuat"
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
          
          <!-- Password Strength Indicator -->
          {#if password}
            <div class="space-y-2">
              <div class="flex justify-between text-xs">
                <span>Kekuatan password:</span>
                <span class={passwordStrength.color}>{passwordStrength.level}</span>
              </div>
              <div class="flex gap-1">
                {#each Array(5) as _, i}
                  <div 
                    class="h-1 flex-1 rounded-full transition-colors duration-300"
                    class:bg-primary={i < passwordStrength.score}
                    class:bg-gray-200={i >= passwordStrength.score}
                  ></div>
                {/each}
              </div>
              <div class="grid grid-cols-2 gap-2 text-xs">
                <div class="flex items-center gap-1">
                  <span class={passwordStrength.checks.length ? 'text-green-500' : 'text-gray-400'}>
                    {passwordStrength.checks.length ? '✓' : '○'}
                  </span>
                  <span>8+ karakter</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class={passwordStrength.checks.numbers ? 'text-green-500' : 'text-gray-400'}>
                    {passwordStrength.checks.numbers ? '✓' : '○'}
                  </span>
                  <span>Mengandung angka</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class={passwordStrength.checks.lowercase ? 'text-green-500' : 'text-gray-400'}>
                    {passwordStrength.checks.lowercase ? '✓' : '○'}
                  </span>
                  <span>Huruf kecil</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class={passwordStrength.checks.uppercase ? 'text-green-500' : 'text-gray-400'}>
                    {passwordStrength.checks.uppercase ? '✓' : '○'}
                  </span>
                  <span>Huruf besar</span>
                </div>
              </div>
            </div>
          {/if}
        </div>

        <!-- Confirm Password Field -->
        <div class="space-y-2">
          <label for="confirmPassword" class="block text-sm font-medium">
            Konfirmasi Password
            {#if passwordsMatch}
              <span class="text-green-500">✓</span>
            {/if}
          </label>
          <div class="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              bind:value={confirmPassword}
              required
              minlength="8"
              maxlength="100"
              class="input w-full pl-10 pr-10"
              placeholder="Ulangi password Anda"
            />
            <button
              type="button"
              on:click={() => showConfirmPassword = !showConfirmPassword}
              class="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {#if showConfirmPassword}
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
          {#if confirmPassword && !passwordsMatch}
            <p class="text-xs text-red-500">Password tidak cocok</p>
          {/if}
        </div>

        <!-- Error/Success Messages -->
        {#if error}
          <div class="p-3 rounded-lg bg-red-50 border border-red-200">
            <p class="text-red-700 text-sm">❌ {error}</p>
          </div>
        {/if}

        {#if success}
          <div class="p-3 rounded-lg bg-green-50 border border-green-200">
            <p class="text-green-700 text-sm">✅ {success}</p>
          </div>
        {/if}

        <!-- Submit Button -->
        <button
          type="submit"
          disabled={loading || !usernameValid || !passwordsMatch || passwordStrength.score < 3}
          class="btn btn-primary w-full py-3 text-lg font-medium"
        >
          {#if loading}
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Membuat akun...
          {:else}
            🎯 Buat Akun Saya
          {/if}
        </button>

        <!-- Login Link -->
        <div class="text-center">
          <p class="text-sm text-secondary">
            Sudah punya akun?
            <button
              type="button"
              on:click={goToLogin}
              class="font-medium text-accent hover:text-primary transition-colors"
            >
              Masuk sekarang
            </button>
          </p>
        </div>
      </form>
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

  /* Floating elements animation - removed since we don't use it anymore */

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

  /* Password strength bar animation */
  .h-1 {
    transition: background-color 0.3s ease;
  }

  /* Utility classes for password strength */
  .bg-primary {
    background-color: var(--color-primary);
  }
  
  .bg-gray-200 {
    background-color: #e5e7eb;
  }

  /* Mobile responsiveness */
  @media (max-width: 1024px) {
    .min-h-screen {
      background: var(--color-surface);
    }
  }
</style>