<script lang="ts">
  let username = '';
  let password = '';
  let error = '';
  let success = '';
  let loading = false;

  async function generateKeyPair() {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      true,
      ['sign', 'verify']
    );

    const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

    // Save private key to localStorage
    localStorage.setItem('ecdsa_private_key', JSON.stringify(privateKeyJwk));

    // Send public key as string
    return JSON.stringify(publicKeyJwk);
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    error = '';
    success = '';
    loading = true;

    try {
      const publicKeyString = await generateKeyPair();

      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, publicKeyString })
      });

      const data = await res.json();
      loading = false;

      if (!res.ok) {
        error = data.error || 'Registration failed.';
      } else {
        success = 'Account created. You can now log in.';
        window.location.href = '/login';
      }
    } catch (err) {
      error = 'Key generation or registration failed.';
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
