// components/contactItem.svelte
<script>
  export let name = "";
  export let selected = false;
  export let onClick = () => {};
</script>
<div class:selected class="contact" on:click={onClick}>
  <h3>{name}</h3>
</div>

<style>
  .contact {
    padding: 1em;
    cursor: pointer;
  }
  .contact:hover {
    background: #2d3e50;
  }
  .selected {
    background: #3399cc;
    color: white;
  }
</style>