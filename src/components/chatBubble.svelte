// components/ChatBubble.svelte
<script>
  export let message = "";
  export let time = "";
  export let isSender = false;
</script>
<div class:isSender class="bubble">
  <p>{message}</p>
  <span class="time">{time}</span>
</div>

<style>
  .bubble {
    max-width: 70%;
    margin: 0.5em;
    padding: 0.8em;
    border-radius: 12px;
    background-color: #2d3e50;
    color: white;
    align-self: flex-start;
    position: relative;
  }
  .bubble.isSender {
    background-color: #3399cc;
    align-self: flex-end;
  }
  .time {
    font-size: 0.6em;
    color: #ccc;
    position: absolute;
    bottom: 4px;
    right: 10px;
  }
</style>