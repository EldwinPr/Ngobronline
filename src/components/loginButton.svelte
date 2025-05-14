// components/loginButton.svelte
<script>
  export let onClick = () => {};
</script>
<button class="primary" on:click={onClick}>Log in</button>

<style>
  .primary {
    width: 100%;
    padding: 0.8em;
    border: none;
    border-radius: 8px;
    background: #3399cc;
    color: white;
    font-weight: bold;
  }
</style>