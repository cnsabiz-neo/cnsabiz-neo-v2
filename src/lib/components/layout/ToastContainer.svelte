<script lang="ts">
	import { toast } from '$lib/stores/toast.svelte';
</script>

<div class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-xs w-full pointer-events-none">
	{#each toast.items as t (t.id)}
		<div
			class="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-bottom-2 duration-300
				{t.type === 'success' ? 'bg-green-500 text-white' :
				 t.type === 'error' ? 'bg-red-500 text-white' :
				 t.type === 'warning' ? 'bg-amber-500 text-white' :
				 'bg-gray-800 text-white'}"
		>
			{#if t.type === 'success'}
				<svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
			{:else if t.type === 'error'}
				<svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
			{/if}
			<span>{t.message}</span>
			<button onclick={() => toast.remove(t.id)} aria-label="닫기" class="ml-auto opacity-70 hover:opacity-100">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
			</button>
		</div>
	{/each}
</div>
