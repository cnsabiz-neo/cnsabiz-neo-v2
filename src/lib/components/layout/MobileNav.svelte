<script lang="ts">
	import { page } from '$app/stores';
	import { getAuthContext } from '$lib/stores/auth.svelte';

	const auth = getAuthContext();

	const isActive = (href: string) =>
		href === '/'
			? $page.url.pathname === '/'
			: $page.url.pathname.startsWith(href);
</script>

<!-- 모바일 전용 하단 고정 내비 (md 이상에서 숨김) -->
<nav class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E5E5E5] h-[56px] flex items-stretch safe-area-pb">

	<!-- 홈 -->
	<a href="/" class="flex-1 flex flex-col items-center justify-center gap-[3px] {isActive('/') ? 'text-[#00C4C4]' : 'text-[#999]'}">
		<svg class="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
				d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
		</svg>
		<span class="text-[10px] font-medium">홈</span>
	</a>

	<!-- 탐색 -->
	<a href="/discover" class="flex-1 flex flex-col items-center justify-center gap-[3px] {isActive('/discover') ? 'text-[#00C4C4]' : 'text-[#999]'}">
		<svg class="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
				d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
		</svg>
		<span class="text-[10px] font-medium">탐색</span>
	</a>

	<!-- 찜 -->
	<a href="/my/fundings" class="flex-1 flex flex-col items-center justify-center gap-[3px] {isActive('/my/fundings') ? 'text-[#00C4C4]' : 'text-[#999]'}">
		<svg class="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
				d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
		</svg>
		<span class="text-[10px] font-medium">위시</span>
	</a>

	<!-- 후원내역 or 대시보드 -->
	<a href="/dashboard" class="flex-1 flex flex-col items-center justify-center gap-[3px] {isActive('/dashboard') ? 'text-[#00C4C4]' : 'text-[#999]'}">
		<svg class="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
				d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
		</svg>
		<span class="text-[10px] font-medium">메이커</span>
	</a>

	<!-- 마이 (로그인 상태 분기) -->
	{#if auth.isLoggedIn}
		<a href="/my/profile" class="flex-1 flex flex-col items-center justify-center gap-[3px] {isActive('/my') ? 'text-[#00C4C4]' : 'text-[#999]'}">
			{#if auth.user?.user_metadata?.avatar_url}
				<img src={auth.user.user_metadata.avatar_url} alt="프로필"
					class="w-[22px] h-[22px] rounded-full object-cover {isActive('/my') ? 'ring-2 ring-[#00C4C4]' : ''}" />
			{:else}
				<div class="w-[22px] h-[22px] rounded-full bg-[#00C4C4] flex items-center justify-center text-white text-[9px] font-bold">
					{(auth.user?.email ?? 'U')[0].toUpperCase()}
				</div>
			{/if}
			<span class="text-[10px] font-medium">마이</span>
		</a>
	{:else}
		<a href="/auth/login" class="flex-1 flex flex-col items-center justify-center gap-[3px] text-[#999]">
			<svg class="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"
					d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
			</svg>
			<span class="text-[10px] font-medium">로그인</span>
		</a>
	{/if}
</nav>
