<script lang="ts">
  import { goto } from '$app/navigation';

  function goToLogin() {
    goto('/login');
  }

  function goToRegister() {
    goto('/register');
  }
</script>

<button on:click={goToLogin}>Login</button>
<button on:click={goToRegister}>Register</button>
