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
  
  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }

  function handleSignUp() {
    goto('/signup');
  }

  function handleForgotPassword() {
    goto('/forgot-password');
  }
</script>

<div class="login-container">
  <div class="login-card">
    <h1>Log In</h1>
    
    <form on:submit={handleLogin}>
      <div class="form-group">
        <label for="email">Email</label>
        <input 
          id="email" 
          type="email" 
          placeholder="Enter your email"
          bind:value={email} 
          required
        />
      </div>

      <div class="form-group">
        <label for="password">Password</label>
        <div class="password-input-container">
          <input 
            id="password" 
            type={showPassword ? "text" : "password"} 
            placeholder="Enter your password"
            bind:value={password} 
            required 
            minlength="8" 
            maxlength="100"
          />
          <button 
            type="button" 
            class="toggle-password" 
            on:click={togglePasswordVisibility}
          >
            👁️
          </button>
        </div>
      </div>

      {#if error}
        <p class="error-message">{error}</p>
      {/if}

      <div class="button-container">
        <LoginButton onClick={handleLogin} />
      </div>
      
      <div class="forgot-password">
        <button type="button" class="link-button" on:click={handleForgotPassword}>
          Forgot Password?
        </button>
      </div>
      
      <div class="signup-link">
        <span>Don't have an account?</span>
        <button type="button" class="link-button bold" on:click={handleSignUp}>
          Sign Up
        </button>
      </div>
    </form>
  </div>
</div>

<style>
  .login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #1e2730;
    padding: 1rem;
  }

  .login-card {
    width: 100%;
    max-width: 450px;
    padding: 2rem;
    border-radius: 20px;
    background-color: #2c353d;
    color: white;
  }

  h1 {
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
    text-align: center;
    color: white;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 1rem;
  }

  input {
    width: 100%;
    padding: 0.8rem;
    border: none;
    border-radius: 30px;
    background: white;
    font-size: 1rem;
    box-sizing: border-box;
  }

  .password-input-container {
    position: relative;
  }

  .toggle-password {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.2rem;
    color: #555;
  }

  .button-container {
    margin-top: 1.5rem;
  }

  .error-message {
    color: #ff6b6b;
    margin: 0.5rem 0;
    font-size: 0.9rem;
  }

  .forgot-password {
    text-align: center;
    margin-top: 1rem;
  }

  .signup-link {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 1.5rem;
  }

  .link-button {
    background: none;
    border: none;
    color: #3399cc;
    cursor: pointer;
    padding: 0;
    font-size: 1rem;
    text-decoration: underline;
  }

  .bold {
    font-weight: bold;
  }
</style>