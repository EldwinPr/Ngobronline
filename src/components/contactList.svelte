// components/contactList.svelte
<script>
  import ContactItem from './contactItem.svelte';
  export let contacts = [];
  export let selectedId = null;
  export let onSelect = () => {};
</script>
<div>
  {#each contacts as contact}
    <ContactItem name={contact.name} selected={contact.id === selectedId} on:click={() => onSelect(contact.id)} />
  {/each}
</div>