<script lang="ts">
  import { onMount } from 'svelte';
  import type { User } from '$lib/types';

  export let currentUsername: string = '';
  export let onSelectContact: (username: string) => void;
  export let selectedContact: string = '';

  let users: User[] = [];
  let loading = true;
  let error = '';
  let searchQuery = '';
  let retryCount = 0;

  // Fetch all users with retry logic
  async function fetchUsers() {
    loading = true;
    error = '';

    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error(`Gagal memuat kontak: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.ok && Array.isArray(data.users)) {
        // Filter out current user
        users = data.users.filter((user: User) => user.username !== currentUsername);
        retryCount = 0; // Reset retry count on success
      } else {
        throw new Error('Format respons tidak valid');
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
      error = err instanceof Error ? err.message : 'Gagal memuat daftar kontak';
      retryCount++;
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

  // Clear search
  function clearSearch() {
    searchQuery = '';
  }

  // Initial fetch on component mount
  onMount(() => {
    fetchUsers();
  });
</script>

<div class="contacts-container h-full flex flex-col">
  <!-- Header -->
  <div class="contacts-header p-4 border-b border">
    <h2 class="text-lg font-semibold mb-3" style="color: var(--color-text)">Kontak</h2>
    
    <!-- Search Bar -->
    <div class="relative">
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Cari kontak..."
        class="input w-full pl-10 pr-10 py-2 text-sm"
      />
      {#if searchQuery}
        <button
          on:click={clearSearch}
          class="absolute inset-y-0 right-0 pr-3 flex items-center transition-colors clear-search-btn"
          style="color: var(--color-text-muted);"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      {/if}
    </div>
  </div>

  <!-- Content Area -->
  <div class="contacts-content flex-1 overflow-hidden">
    {#if loading}
      <!-- Loading State -->
      <div class="p-4">
        <div class="animate-pulse space-y-3">
          {#each Array(5) as _}
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 rounded-full" style="background-color: var(--color-surface-hover)"></div>
              <div class="flex-1">
                <div class="h-4 rounded w-3/4 mb-2" style="background-color: var(--color-surface-hover)"></div>
                <div class="h-3 rounded w-1/2" style="background-color: var(--color-surface-hover)"></div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else if error}
      <!-- Error State -->
      <div class="p-4 text-center">
        <div class="flex flex-col items-center space-y-3">
          <svg class="h-12 w-12" style="color: var(--color-error)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div class="text-sm" style="color: var(--color-error)">
            <p class="font-medium">Terjadi kesalahan</p>
            <p class="text-xs mt-1">{error}</p>
            {#if retryCount > 0}
              <p class="text-xs mt-1" style="color: var(--color-text-muted)">Percobaan ke-{retryCount}</p>
            {/if}
          </div>
          <button 
            class="btn btn-ghost text-sm"
            on:click={fetchUsers}
          >
            Coba Lagi
          </button>
        </div>
      </div>
    {:else if filteredUsers.length === 0}
      <!-- Empty State -->
      <div class="p-4 text-center">
        <div class="flex flex-col items-center space-y-3">
          {#if searchQuery}
            <svg class="h-12 w-12" style="color: var(--color-text-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <div class="text-sm" style="color: var(--color-text-muted)">
              <p class="font-medium">Tidak ada hasil</p>
              <p class="text-xs mt-1">Coba kata kunci yang berbeda</p>
            </div>
            <button 
              class="btn btn-primary text-sm"
              on:click={clearSearch}
            >
              Bersihkan pencarian
            </button>
          {:else}
            <svg class="h-12 w-12" style="color: var(--color-text-muted)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <div class="text-sm" style="color: var(--color-text-muted)">
              <p class="font-medium">Belum ada kontak</p>
              <p class="text-xs mt-1">Kontak akan muncul di sini</p>
            </div>
          {/if}
        </div>
      </div>
    {:else}
      <!-- Contacts List -->
      <div class="contacts-list overflow-y-auto h-full">
        <div class="px-4 py-2">
          <div class="text-xs mb-2" style="color: var(--color-text-muted)">
            {filteredUsers.length} kontak {searchQuery ? 'ditemukan' : 'tersedia'}
          </div>
        </div>
        
        <div class="space-y-1 px-2">
          {#each filteredUsers as user (user.id)}
            <button
              class="contact-item w-full p-3 text-left rounded-lg transition-all duration-200 group relative"
              class:selected={selectedContact === user.username}
              on:click={() => selectContact(user.username)}
            >
              <div class="flex items-center space-x-3">
                <!-- Avatar -->
                <div class="relative">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm contact-avatar">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <!-- Online status dot (placeholder for future feature) -->
                  <!-- <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div> -->
                </div>
                
                <!-- User Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2">
                    <p class="font-medium truncate" style="color: var(--color-text)">
                      {user.username}
                    </p>
                    <!-- Unread badge (placeholder for future feature) -->
                    <!-- <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">2</span> -->
                  </div>
                  <p class="text-xs mt-0.5" style="color: var(--color-text-muted)">
                    Klik untuk mulai chat
                  </p>
                </div>
                
                <!-- Selection indicator -->
                {#if selectedContact === user.username}
                  <div style="color: var(--color-primary)">
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                {:else}
                  <div class="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </div>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>
  
  <!-- Footer (optional stats or actions) -->
  <div class="contacts-footer p-4 border-t border" style="background-color: var(--color-surface-hover)">
    <div class="text-xs text-center" style="color: var(--color-text-muted)">
      Total {users.length} kontak terdaftar
    </div>
  </div>
</div>

<style>
  .contacts-container {
    background-color: var(--color-surface);
    border-radius: 0.5rem;
    border: 1px solid var(--color-border);
    box-shadow: 0 1px 3px var(--color-shadow);
  }

  .contacts-header {
    border-color: var(--color-border);
  }

  .contacts-footer {
    border-color: var(--color-border);
  }

  /* Contact item styles */
  .contact-item {
    border: 1px solid transparent;
    background-color: transparent;
  }

  .contact-item:hover {
    background-color: var(--color-surface-hover);
    border-color: var(--color-border-hover);
  }

  .contact-item.selected {
    background-color: var(--color-primary);
    background-opacity: 0.1;
    border-color: var(--color-primary);
    box-shadow: 0 1px 3px var(--color-shadow);
  }

  .contact-avatar {
    background: linear-gradient(135deg, var(--color-primary), var(--color-primary-hover));
  }

  .contacts-list {
    scrollbar-width: thin;
    scrollbar-color: var(--color-border) transparent;
  }

  .contacts-list::-webkit-scrollbar {
    width: 6px;
  }

  .contacts-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .contacts-list::-webkit-scrollbar-thumb {
    background-color: var(--color-border);
    border-radius: 3px;
  }

  .contacts-list::-webkit-scrollbar-thumb:hover {
    background-color: var(--color-border-hover);
  }

  /* Search icon styling */
  .absolute.inset-y-0.left-0 svg {
    color: var(--color-text-muted);
  }

  .clear-search-btn:hover {
    color: var(--color-text-secondary) !important;
  }
</style>