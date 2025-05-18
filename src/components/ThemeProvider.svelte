<!-- src/lib/components/ThemeProvider.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { currentThemeConfig, themeStore } from '$lib/stores/themeStore';

  let mounted = false;

  // Apply CSS custom properties when theme changes
  function applyCSSVariables(config: any) {
    if (!mounted || typeof document === 'undefined') return;

    const root = document.documentElement;
    
    // Apply all theme variables as CSS custom properties
    Object.entries(config).forEach(([key, value]) => {
      if (key !== 'name' && key !== 'displayName') {
        root.style.setProperty(`--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value as string);
      }
    });
    
    // Set data attribute for theme identification
    root.setAttribute('data-theme', config.name);
  }

  onMount(() => {
    mounted = true;
    // Apply initial theme
    applyCSSVariables($currentThemeConfig);
  });

  // React to theme changes
  $: if (mounted) {
    applyCSSVariables($currentThemeConfig);
  }
</script>

<!-- Global styles for theme system -->
<style>
  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    background-color: var(--color-background, #111827);
    color: var(--color-text, #f9fafb);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    margin: 0;
    padding: 0;
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  /* Scrollbar styling */
  :global(::-webkit-scrollbar) {
    width: 8px;
    height: 8px;
  }

  :global(::-webkit-scrollbar-track) {
    background: var(--color-surface, #1f2937);
  }

  :global(::-webkit-scrollbar-thumb) {
    background: var(--color-border, #374151);
    border-radius: 4px;
  }

  :global(::-webkit-scrollbar-thumb:hover) {
    background: var(--color-border-hover, #4b5563);
  }

  /* Theme-aware utility classes */
  :global(.surface) {
    background-color: var(--color-surface, #1f2937);
    color: var(--color-text, #f9fafb);
  }

  :global(.surface-hover) {
    background-color: var(--color-surface-hover, #374151);
  }

  :global(.primary) {
    background-color: var(--color-primary, #f59e0b);
    color: var(--color-primary-text, #ffffff);
  }

  :global(.primary:hover) {
    background-color: var(--color-primary-hover, #d97706);
  }

  :global(.secondary) {
    background-color: var(--color-secondary, #6b7280);
    color: var(--color-primary-text, #ffffff);
  }

  :global(.secondary:hover) {
    background-color: var(--color-secondary-hover, #4b5563);
  }

  :global(.accent) {
    color: var(--color-accent, #fbbf24);
  }

  :global(.text-secondary) {
    color: var(--color-text-secondary, #d1d5db);
  }

  :global(.text-muted) {
    color: var(--color-text-muted, #9ca3af);
  }

  :global(.border) {
    border-color: var(--color-border, #374151);
  }

  :global(.border-hover) {
    border-color: var(--color-border-hover, #4b5563);
  }

  :global(.success) {
    color: var(--color-success, #10b981);
  }

  :global(.warning) {
    color: var(--color-warning, #f59e0b);
  }

  :global(.error) {
    color: var(--color-error, #ef4444);
  }

  /* Button base styles */
  :global(.btn) {
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    border: none;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  :global(.btn:disabled) {
    opacity: 0.5;
    cursor: not-allowed;
  }

  :global(.btn-primary) {
    background-color: var(--color-primary, #f59e0b);
    color: var(--color-primary-text, #ffffff);
  }

  :global(.btn-primary:hover:not(:disabled)) {
    background-color: var(--color-primary-hover, #d97706);
  }

  :global(.btn-secondary) {
    background-color: var(--color-secondary, #6b7280);
    color: var(--color-primary-text, #ffffff);
  }

  :global(.btn-secondary:hover:not(:disabled)) {
    background-color: var(--color-secondary-hover, #4b5563);
  }

  :global(.btn-ghost) {
    background-color: transparent;
    color: var(--color-text, #f9fafb);
    border: 1px solid var(--color-border, #374151);
  }

  :global(.btn-ghost:hover:not(:disabled)) {
    background-color: var(--color-surface-hover, #374151);
    border-color: var(--color-border-hover, #4b5563);
  }

  /* Input styles */
  :global(.input) {
    padding: 0.75rem;
    border-radius: 0.375rem;
    border: 1px solid var(--color-border, #374151);
    background-color: var(--color-surface, #1f2937);
    color: var(--color-text, #f9fafb);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
  }

  :global(.input:focus) {
    outline: none;
    border-color: var(--color-primary, #f59e0b);
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
  }

  :global(.input::placeholder) {
    color: var(--color-text-muted, #9ca3af);
  }

  /* Card styles */
  :global(.card) {
    background-color: var(--color-surface, #1f2937);
    border: 1px solid var(--color-border, #374151);
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px var(--color-shadow, rgba(0, 0, 0, 0.3));
    padding: 1rem;
  }

  :global(.card:hover) {
    border-color: var(--color-border-hover, #4b5563);
  }

  /* Modal overlay */
  :global(.modal-overlay) {
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
  }

  :global(.modal-content) {
    background-color: var(--color-surface, #1f2937);
    border: 1px solid var(--color-border, #374151);
    border-radius: 0.5rem;
    box-shadow: 0 10px 25px var(--color-shadow, rgba(0, 0, 0, 0.3));
  }
</style>

<slot />