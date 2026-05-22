<script lang="ts">
	import { formatShortKRW, formatNumber } from '$lib/utils/currency';
	import { getFundingRate, getDaysLeft } from '$lib/utils/date';
	import type { Database } from '$lib/supabase/types';

	type Project = Database['public']['Tables']['projects']['Row'] & {
		profiles?: { display_name: string | null; avatar_url: string | null };
		categories?: { name: string };
	};

	let { project, size = 'default', liked = false }: {
		project: Project;
		size?: 'default' | 'compact' | 'wide';
		liked?: boolean;
	} = $props();

	const rate = $derived(getFundingRate(project.current_amount, project.goal_amount));
	const daysLeft = $derived(project.ends_at ? getDaysLeft(project.ends_at) : 0);
	const isEnded = $derived(daysLeft === 0);
	const isLive = $derived(!isEnded && project.status === 'active');

	/** 달성률 색상 */
	const rateColor = $derived(rate >= 100 ? '#00C4C4' : '#00C4C4');

	/** 찜 상태 (낙관적 업데이트) */
	let isLiked = $state(liked);
	let likeLoading = $state(false);

	// prop이 바뀌면 내부 상태 동기화 (페이지 이동 후 새 데이터)
	$effect(() => { isLiked = liked; });

	async function toggleLike(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		if (likeLoading) return;

		likeLoading = true;
		isLiked = !isLiked; // 낙관적 업데이트

		try {
			const res = await fetch(`/api/likes/${project.id}`, { method: 'POST' });
			if (!res.ok) {
				isLiked = !isLiked; // 실패 시 롤백
				if (res.status === 401) {
					window.location.href = '/auth/login';
				}
			}
		} catch {
			isLiked = !isLiked; // 실패 시 롤백
		} finally {
			likeLoading = false;
		}
	}
</script>

<a
	href="/projects/{project.slug}"
	class="group block bg-white card-hover rounded-[4px] overflow-hidden cursor-pointer"
>
	<!-- 썸네일 -->
	<div class="relative aspect-[16/9] overflow-hidden bg-[#F4F4F4]">
		{#if project.thumbnail_url}
			<img
				src={project.thumbnail_url}
				alt={project.title}
				class="w-full h-full object-cover"
				loading="lazy"
			/>
		{:else}
			<!-- 플레이스홀더 -->
			<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F0FAFA] to-[#E0F5F5]">
				<svg class="w-10 h-10 text-[#00C4C4] opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
				</svg>
			</div>
		{/if}

		<!-- 상단 좌측: 메이커 뱃지 -->
		{#if project.profiles?.avatar_url}
			<div class="absolute top-2 left-2 w-6 h-6 rounded-sm overflow-hidden bg-black border border-white/20 shadow-sm">
				<img src={project.profiles.avatar_url} alt="메이커" class="w-full h-full object-cover" />
			</div>
		{:else}
			<div class="absolute top-2 left-2 w-6 h-6 rounded-sm bg-[#1A1A1A] flex items-center justify-center shadow-sm">
				<span class="text-white text-[9px] font-black">M</span>
			</div>
		{/if}

		<!-- 상단 우측: 찜하기 -->
		<button
			class="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-sm
				{likeLoading ? 'opacity-60' : ''}"
			onclick={toggleLike}
			aria-label={isLiked ? '찜 해제' : '찜하기'}
		>
			{#if isLiked}
				<svg class="w-3.5 h-3.5 text-[#FF5C35]" fill="currentColor" viewBox="0 0 24 24">
					<path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
				</svg>
			{:else}
				<svg class="w-3.5 h-3.5 text-[#999]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
				</svg>
			{/if}
		</button>

		<!-- 마감 오버레이 -->
		{#if isEnded}
			<div class="absolute inset-0 bg-black/30 flex items-center justify-center">
				<span class="px-2.5 py-1 bg-black/70 text-white text-xs font-semibold rounded-full">마감</span>
			</div>
		{/if}
	</div>

	<!-- 카드 본문 -->
	<div class="pt-2.5 pb-3">
		<!-- 카테고리 -->
		{#if project.categories}
			<p class="text-[11px] text-[#999] mb-1 truncate">{project.categories.name}</p>
		{/if}

		<!-- 제목 -->
		<h3 class="text-[13px] font-medium text-[#1A1A1A] line-clamp-2 leading-[1.5] mb-2">
			{project.title}
		</h3>

		<!-- 달성률 + 남은 날 -->
		<div class="flex items-baseline justify-between mb-1.5">
			<span class="text-[15px] font-bold" style="color: {rateColor};">
				{rate.toLocaleString('ko-KR')}%
				<span class="text-[12px] font-medium text-[#999]">달성</span>
			</span>
			{#if isLive && daysLeft > 0}
				<span class="text-[12px] text-[#999]">{daysLeft}일 남음</span>
			{:else if isLive}
				<span class="text-[11px] text-[#00C4C4] font-medium">오늘 마감</span>
			{/if}
		</div>

		<!-- 모집 금액 + 후원자 -->
		<p class="text-[12px] text-[#999]">
			{formatShortKRW(project.current_amount)}
			{#if project.backer_count > 0}
				<span class="mx-1">|</span>{formatNumber(project.backer_count)}명 후원
			{/if}
		</p>
	</div>
</a>
