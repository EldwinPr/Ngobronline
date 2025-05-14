// components/sendButton.svelte
<script>
  export let onClick = () => {};
</script>
<button class="send" on:click={onClick}>📤</button>

<style>
  .send {
    background: #3399cc;
    border: none;
    border-radius: 6px;
    padding: 0.6em 1em;
    color: white;
  }
</style>