<script lang="ts">
	import CampaignCard from '$lib/components/campaign/CampaignCard.svelte';
	import CategoryNav from '$lib/components/campaign/CategoryNav.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { data } = $props();
	let searchInput = $state(data.query ?? '');

	function handleSearch(e: SubmitEvent) {
		e.preventDefault();
		const params = new URLSearchParams($page.url.searchParams);
		if (searchInput.trim()) params.set('q', searchInput.trim());
		else params.delete('q');
		goto(`/discover?${params}`);
	}

	function setSort(sort: string) {
		const params = new URLSearchParams($page.url.searchParams);
		params.set('sort', sort);
		goto(`/discover?${params}`);
	}

	const sortOptions = [
		{ value: 'popular', label: '인기순' },
		{ value: 'new', label: '최신순' },
		{ value: 'ending', label: '마감임박' }
	];
</script>

<svelte:head>
	<title>펀딩 탐색 — 큰사비즈</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-6">
	<!-- 검색 바 -->
	<form onsubmit={handleSearch} class="flex gap-2 mb-6">
		<div class="flex-1 relative">
			<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
			</svg>
			<input
				type="search"
				bind:value={searchInput}
				placeholder="프로젝트를 검색하세요"
				class="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00C4C4] focus:border-transparent"
			/>
		</div>
		<button type="submit" class="px-5 py-2.5 bg-[#00C4C4] text-white font-semibold text-sm rounded-xl hover:bg-[#00AFAF] transition-colors">
			검색
		</button>
	</form>

	<!-- 카테고리 -->
	<CategoryNav categories={data.categories} active={data.activeCategory} />

	<!-- 정렬 + 결과 수 -->
	<div class="flex items-center justify-between mt-5 mb-4">
		<p class="text-sm text-gray-500">
			{#if data.query}<strong class="text-gray-800">"{data.query}"</strong> 검색 결과 · {/if}
			<span class="font-semibold text-gray-800">{data.projects.length}</span>개의 프로젝트
		</p>
		<div class="flex items-center gap-1">
			{#each sortOptions as opt}
				<button
					onclick={() => setSort(opt.value)}
					class="px-3 py-1 text-xs font-medium rounded-full transition-colors
						{data.sort === opt.value ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}"
				>
					{opt.label}
				</button>
			{/each}
		</div>
	</div>

	<!-- 프로젝트 그리드 -->
	{#if data.projects.length > 0}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
			{#each data.projects as project}
				<CampaignCard {project} />
			{/each}
		</div>
	{:else}
		<div class="py-20 text-center">
			<p class="text-gray-400 text-lg">검색 결과가 없습니다.</p>
			<p class="text-gray-300 text-sm mt-1">다른 키워드로 검색해보세요.</p>
		</div>
	{/if}
</div>
