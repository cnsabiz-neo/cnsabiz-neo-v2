<script lang="ts">
	import CampaignCard from '$lib/components/campaign/CampaignCard.svelte';

	let { data } = $props();
	const likedSet = $derived(new Set(data.likedIds ?? []));
</script>

<svelte:head><title>찜 목록 — 큰사비즈</title></svelte:head>

<div class="max-w-[1200px] mx-auto px-4 py-8">
	<h1 class="text-[22px] font-bold text-[#1A1A1A] mb-6">찜한 프로젝트</h1>

	{#if data.projects.length === 0}
		<div class="text-center py-20 bg-[#FAFAFA] rounded-2xl">
			<div class="w-14 h-14 mx-auto mb-4 rounded-full bg-white flex items-center justify-center">
				<svg class="w-7 h-7 text-[#DDDDDD]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
				</svg>
			</div>
			<p class="text-[14px] text-[#888] mb-4">아직 찜한 프로젝트가 없어요.</p>
			<a href="/discover" class="inline-block px-6 py-2.5 bg-[#00C4C4] text-white font-semibold rounded-full hover:bg-[#00AFAF] transition-colors">
				프로젝트 둘러보기
			</a>
		</div>
	{:else}
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
			{#each data.projects as project}
				<CampaignCard {project} liked={likedSet.has(project.id)} />
			{/each}
		</div>
	{/if}
</div>
