<script lang="ts">
  import { onMount } from 'svelte';
  import type { User } from '$lib/types';

  export let currentUsername: string = '';
  export let onSelectContact: (username: string) => void;

  let users: User[] = [];
  let loading = true;
  let error = '';
  let searchQuery = '';

  // Fetch all users
  async function fetchUsers() {
    loading = true;
    error = '';

    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error(`Error fetching users: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.ok && Array.isArray(data.users)) {
        // Filter out current user
        users = data.users.filter((user: User) => user.username !== currentUsername);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      error = err instanceof Error ? err.message : 'Failed to load contacts';
    } finally {
      loading = false;
    }
  }

  // Filter users based on search query
  $: filteredUsers = searchQuery 
    ? users.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  // Handle contact selection
  function selectContact(username: string) {
    onSelectContact(username);
  }

  // Initial fetch on component mount
  onMount(() => {
    fetchUsers();
  });
</script>

<div class="contacts-container">
  <div class="search-container mb-2">
    <input
      type="text"
      bind:value={searchQuery}
      placeholder="Search contacts..."
      class="w-full p-2 border border-gray-300 rounded"
    />
  </div>

  {#if loading}
    <div class="text-center py-4 text-gray-500">Loading contacts...</div>
  {:else if error}
    <div class="text-center py-4 text-red-500">
      <p>{error}</p>
      <button 
        class="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
        on:click={fetchUsers}
      >
        Retry
      </button>
    </div>
  {:else if filteredUsers.length === 0}
    <div class="text-center py-4 text-gray-500">
      {searchQuery ? 'No contacts match your search' : 'No contacts available'}
    </div>
  {:else}
    <div class="contacts-list">
      <h3 class="font-medium text-sm mb-2 text-gray-600">Contacts ({filteredUsers.length})</h3>
      <div class="divide-y border rounded overflow-hidden">
        {#each filteredUsers as user}
          <button
            class="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
            on:click={() => selectContact(user.username)}
          >
            <div class="bg-blue-100 text-blue-800 w-10 h-10 rounded-full flex items-center justify-center font-bold flex-shrink-0">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p class="font-medium">{user.username}</p>
              <p class="text-xs text-gray-500">Click to start chatting</p>
            </div>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>