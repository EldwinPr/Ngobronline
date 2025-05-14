// components/searchBar.svelte
<script>
  export let keyword = "";
  export let onInput = () => {};
</script>
<input
  type="text"
  placeholder="Search"
  bind:value={keyword}
  on:input={onInput}
/>

<style>
  input {
    width: 100%;
    padding: 0.6em;
    border-radius: 8px;
    border: none;
    margin: 0.5em 0;
  }
</style>