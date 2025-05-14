// components/logoutButton.svelte
<script>
  export let onClick = () => {};
</script>
<button class="icon" on:click={onClick}>⎋</button>

<style>
  .icon {
    background: transparent;
    border: none;
    font-size: 1.4em;
    color: white;
  }
</style>