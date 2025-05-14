<script lang="ts">
  let username = '';
  let password = '';
  let error = '';
  let loading = false;

  async function handleSubmit(event: Event) {
    event.preventDefault();
    error = '';
    loading = true;

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    loading = false;

    if (!res.ok) {
      error = data.error || 'Login failed.';
    } else {
      // Store user ID and username
      localStorage.setItem('user_id', data.user.id);
      localStorage.setItem('username', data.user.username);
      window.location.href = '/';
    }
  }
</script>

<style>
  form {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }
</style>

<form on:submit|preventDefault={handleSubmit}>
  <div>
    <label for="username">Username</label>
    <input id="username" bind:value={username} required />
  </div>

  <div>
    <label for="password">Password</label>
    <input id="password" type="password" bind:value={password} required />
  </div>

  {#if error}
    <p>{error}</p>
  {/if}

  <button type="submit" disabled={loading}>
    {loading ? 'Logging in...' : 'Login'}
  </button>
</form>
