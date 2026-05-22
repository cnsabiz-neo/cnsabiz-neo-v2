<script lang="ts">
	let { name, avatarUrl = null, isCreator = false, size = 'md' }: {
		name: string;
		avatarUrl?: string | null;
		isCreator?: boolean;
		size?: 'sm' | 'md' | 'lg';
	} = $props();

	const sizeClass = $derived({ sm: 'w-6 h-6 text-xs', md: 'w-8 h-8 text-sm', lg: 'w-12 h-12 text-base' }[size]);
</script>

<div class="flex items-center gap-2">
	<div class="relative shrink-0">
		<div class="rounded-full overflow-hidden bg-[#00C4C4] flex items-center justify-center text-white font-bold {sizeClass}">
			{#if avatarUrl}
				<img src={avatarUrl} alt={name} class="w-full h-full object-cover" />
			{:else}
				{name[0]?.toUpperCase() ?? 'C'}
			{/if}
		</div>
		{#if isCreator}
			<span class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 rounded-full flex items-center justify-center border border-white">
				<svg class="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
				</svg>
			</span>
		{/if}
	</div>
	<span class="text-sm text-gray-700 font-medium">{name}</span>
</div>
