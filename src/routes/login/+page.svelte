<script lang="ts">
  import { generateKeyPair } from '$lib/keyDerivation';
  import { goto } from '$app/navigation';

  let username = '';
  let password = '';
  let error = '';
  let loading = false;

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
        throw new Error(result.error || 'Login failed.');
      }

      console.log('Login successful:', result);

      let privateKey = localStorage.getItem('ecdsa_private_key');
      if (!privateKey) {
        console.log('Private key not found. Generating a new one...');
        const keyPair = await generateKeyPair(username, password);
        privateKey = JSON.stringify(keyPair.privateKey);
        localStorage.setItem('ecdsa_private_key', privateKey);
        console.log('New private key generated and saved.');
      } else {
        console.log('Private key already exists.');
      }

      localStorage.setItem('username', result.user.username);
      localStorage.setItem('user_id', result.user.id);

      goto('/');
    } catch (err: any) {
      error = err?.message || 'Login failed.';
    } finally {
      loading = false;
    }
  }
</script>

<form on:submit={handleLogin}>
  <div>
    <label for="username">Username</label>
    <input id="username" bind:value={username} required minlength="3" maxlength="30" />
  </div>

  <div>
    <label for="password">Password</label>
    <input id="password" type="password" bind:value={password} required minlength="8" maxlength="100" />
  </div>

  {#if error}
    <p>{error}</p>
  {/if}

  <button type="submit" disabled={loading}>
    {loading ? 'Logging in...' : 'Login'}
  </button>
</form>
