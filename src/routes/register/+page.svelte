<script lang="ts">
  import { deriveEcdsaKeyPair } from '$lib/keyDerivation';

  let username = '';
  let password = '';
  let error = '';
  let success = '';
  let loading = false;

  async function handleSubmit(event: Event) {
    event.preventDefault();
    error = '';
    success = '';
    loading = true;

    try {
      const { publicKey, privateKey } = await deriveEcdsaKeyPair(username, password);

      // Save private key to localStorage
      localStorage.setItem('ecdsa_private_key', JSON.stringify(privateKey));

      // Send public key to server
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, publicKey })
      });

      if (!res.ok) {
        throw new Error('Registration failed.');
      }

      success = 'Account created. You can now log in.';
      window.location.href = '/login';
    } catch (err) {
      error = 'Key generation or registration failed.';
    } finally {
      loading = false;
    }
  }
</script>

<form on:submit={handleSubmit}>
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

  {#if success}
    <p>{success}</p>
  {/if}

  <button type="submit" disabled={loading}>
    {loading ? 'Registering...' : 'Register'}
  </button>
</form>
