<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import ThemeProvider from '../components/ThemeProvider.svelte';
	
	let { children } = $props();
</script>

<ThemeProvider>
	{@render children()}
</ThemeProvider>