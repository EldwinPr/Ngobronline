// components/inputMessage.svelte
<script>
  export let message = "";
  export let onSend = () => {};
</script>
<div class="input-container">
  <input bind:value={message} on:keydown={(e) => e.key === 'Enter' && onSend()} placeholder="Ketik pesan" />
  <slot></slot>
</div>

<style>
  .input-container {
    display: flex;
    padding: 1em;
    background: #1d2a33;
  }
  input {
    flex: 1;
    padding: 0.5em;
    border-radius: 6px;
    border: none;
    margin-right: 0.5em;
  }
</style>