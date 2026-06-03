<script lang="ts">
	import { fundingCart } from '$lib/stores/funding-cart.svelte';
	import { formatShortKRW, formatKRW, formatNumber } from '$lib/utils/currency';
	import { getFundingRate, getDaysLeft, formatKoDate } from '$lib/utils/date';
	import { onMount } from 'svelte';

	let { data } = $props();

	const project     = $derived(data.project);
	const creator     = $derived(data.project.profiles);
	const category    = $derived(data.project.categories);
	const rate        = $derived(getFundingRate(project.current_amount, project.goal_amount));
	const daysLeft    = $derived(project.ends_at ? getDaysLeft(project.ends_at) : null);
	const isActive    = $derived(project.status === 'active');
	const isPending   = $derived(project.status === 'pending_review' || project.status === 'draft');

	// ──────────── 탭 ────────────
	type Tab = 'story' | 'updates' | 'comments';
	let activeTab = $state<Tab>('story');

	// ──────────── 리워드 선택 ────────────
	function isSoldOut(r: (typeof data.rewards)[number]) {
		return r.max_quantity !== null && r.claimed_count >= r.max_quantity;
	}
	const selectedId = $derived(fundingCart.item?.reward.id ?? null);

	// ──────────── sticky 탭바 감지 ────────────
	let headerStuck = $state(false);
	onMount(() => {
		const sentinel = document.getElementById('tab-sentinel');
		if (!sentinel) return;
		const obs = new IntersectionObserver(([e]) => { headerStuck = !e.isIntersecting; }, { threshold: 0 });
		obs.observe(sentinel);
		return () => obs.disconnect();
	});

	// ──────────── 공유 ────────────
	async function share() {
		if (navigator.share) {
			await navigator.share({ title: project.title, url: location.href });
		} else {
			await navigator.clipboard.writeText(location.href);
		}
	}

	// ──────────── 찜하기 ────────────
	let isLiked = $state(data.isLiked);
	let likeLoading = $state(false);
	$effect(() => { isLiked = data.isLiked; });

	async function toggleLike() {
		if (likeLoading) return;
		likeLoading = true;
		isLiked = !isLiked; // 낙관적 업데이트
		try {
			const res = await fetch(`/api/likes/${project.id}`, { method: 'POST' });
			if (!res.ok) {
				isLiked = !isLiked; // 롤백
				if (res.status === 401) window.location.href = '/auth/login';
			}
		} catch {
			isLiked = !isLiked; // 롤백
		} finally {
			likeLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{project.title} — 큰사비즈</title>
	<meta name="description" content={project.subtitle ?? project.title} />
	<meta property="og:title" content={project.title} />
	{#if project.thumbnail_url}
		<meta property="og:image" content={project.thumbnail_url} />
	{/if}
</svelte:head>

<!-- ──────────────────────────────────────────────────
     Sticky 탭 네비게이션
────────────────────────────────────────────────── -->
<div id="tab-sentinel" class="h-0"></div>
<div class="sticky top-14 z-30 bg-white border-b border-[#EBEBEB] transition-shadow {headerStuck ? 'shadow-sm' : ''}">
	<div class="max-w-7xl mx-auto px-4">
		<div class="flex items-center">
			<!-- 탭 버튼들 -->
			{#each [['story','스토리'], ['updates',`업데이트 ${data.updates.length}`], ['comments',`커뮤니티 ${data.comments.length}`]] as [tab, label]}
				<button
					onclick={() => { activeTab = tab as Tab; document.getElementById('tab-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
					class="px-5 py-4 text-[13px] font-semibold border-b-2 transition-colors whitespace-nowrap -mb-px
						{activeTab === tab ? 'border-[#1A1A1A] text-[#1A1A1A]' : 'border-transparent text-[#888] hover:text-[#333]'}"
				>
					{label}
				</button>
			{/each}
		</div>
	</div>
</div>

<!-- ──────────────────────────────────────────────────
     메인 레이아웃
────────────────────────────────────────────────── -->
<div class="max-w-7xl mx-auto px-4 py-6">
	<div class="flex flex-col lg:flex-row gap-8">

		<!-- ════════════════════════════════
		     LEFT: 썸네일 + 스토리
		════════════════════════════════ -->
		<div class="flex-1 min-w-0">

			<!-- 심사 중 / 작성 중 배너 (본인만 노출) -->
			{#if isPending && data.isOwner}
				<div class="mb-4 flex items-start gap-3 bg-[#FFFBF0] border border-[#FFE8B0] rounded-xl px-4 py-3">
					<svg class="w-5 h-5 text-[#E09000] shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
					<div>
						<p class="text-[13px] font-bold text-[#886600]">
							{project.status === 'pending_review' ? '심사 중입니다' : '작성 중인 프로젝트'}
						</p>
						<p class="text-[12px] text-[#886600] mt-0.5">
							{project.status === 'pending_review'
								? '관리자 검토 후 1~3 영업일 내로 오픈됩니다. 이 페이지는 본인만 볼 수 있습니다.'
								: '아직 공개되지 않은 프로젝트입니다.'}
						</p>
					</div>
				</div>
			{/if}

			<!-- 썸네일 -->
			<div class="aspect-video rounded-2xl overflow-hidden bg-[#F0F0F0] mb-6">
				{#if project.thumbnail_url}
					<img src={project.thumbnail_url} alt={project.title} class="w-full h-full object-cover" />
				{:else}
					<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#E6FAFA] to-[#C5F5F5]">
						<svg class="w-16 h-16 text-[#00C4C4] opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
						</svg>
					</div>
				{/if}
			</div>

			<!-- 카테고리 태그 -->
			{#if category}
				<a href="/discover?category={category.slug}"
					class="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F0FDFD] text-[#00A0A0] text-[11px] font-bold rounded-full border border-[#CCEEEE] hover:bg-[#E0F8F8] transition-colors mb-2">
					{category.name}
				</a>
			{/if}

			<!-- 제목 -->
			<h1 class="text-[22px] font-bold text-[#1A1A1A] leading-snug mb-1">{project.title}</h1>
			{#if project.subtitle}
				<p class="text-[14px] text-[#888] mb-4">{project.subtitle}</p>
			{/if}

			<!-- 모바일 전용 통계 (lg에선 사이드바로) -->
			<div class="lg:hidden mb-5 bg-white border border-[#EBEBEB] rounded-2xl p-4">
				<div class="flex items-end gap-2 mb-2">
					<span class="text-[28px] font-black text-[#00C4C4]">{rate.toLocaleString()}%</span>
					<span class="text-[13px] text-[#888] mb-0.5">달성</span>
				</div>
				<div class="h-2 bg-[#F0F0F0] rounded-full mb-3 overflow-hidden">
					<div class="h-full bg-[#00C4C4] rounded-full transition-all" style="width: {Math.min(rate, 100)}%"></div>
				</div>
				<div class="grid grid-cols-3 gap-2 text-center">
					<div>
						<p class="text-[15px] font-bold text-[#1A1A1A]">{formatShortKRW(project.current_amount)}</p>
						<p class="text-[10px] text-[#AAAAAA]">모인 금액</p>
					</div>
					<div>
						<p class="text-[15px] font-bold text-[#1A1A1A]">{formatNumber(project.backer_count)}</p>
						<p class="text-[10px] text-[#AAAAAA]">후원자</p>
					</div>
					<div>
						<p class="text-[15px] font-bold text-[#1A1A1A]">{daysLeft !== null ? `D-${daysLeft}` : '—'}</p>
						<p class="text-[10px] text-[#AAAAAA]">남은 날</p>
					</div>
				</div>
				{#if isActive}
					<a href="/fund/{project.id}"
						class="mt-3 block w-full text-center py-3 bg-[#00C4C4] text-white font-bold text-[15px] rounded-xl hover:bg-[#00AFAF] transition-colors">
						후원하기
					</a>
				{/if}
			</div>

			<!-- 탭 앵커 -->
			<div id="tab-content"></div>

			<!-- 탭 콘텐츠 -->
			<div class="mt-2">
				{#if activeTab === 'story'}
					{#if data.storyHtml}
						<div class="project-story text-[15px] leading-[1.9] text-[#333]">
							{@html data.storyHtml}
						</div>
					{:else}
						<div class="py-20 text-center">
							<svg class="w-12 h-12 mx-auto text-[#DCDCDC] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
							</svg>
							<p class="text-[14px] text-[#BBBBBB]">아직 스토리가 작성되지 않았습니다.</p>
						</div>
					{/if}

				{:else if activeTab === 'updates'}
					{#if data.updates.length > 0}
						<div class="space-y-6">
							{#each data.updates as u}
								<article class="border-b border-[#F0F0F0] pb-6">
									<h3 class="text-[15px] font-bold text-[#1A1A1A] mb-1">{u.title}</h3>
									<p class="text-[12px] text-[#AAAAAA] mb-3">{formatKoDate(u.created_at)}</p>
									<div class="text-[14px] text-[#555] leading-relaxed project-story">{@html u.content_html}</div>
								</article>
							{/each}
						</div>
					{:else}
						<div class="py-20 text-center">
							<svg class="w-12 h-12 mx-auto text-[#DCDCDC] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
							</svg>
							<p class="text-[14px] text-[#BBBBBB]">아직 업데이트가 없습니다.</p>
						</div>
					{/if}

				{:else}
					<!-- 댓글 탭 -->
					{#if data.comments.length > 0}
						<div class="space-y-5">
							{#each data.comments as c}
								{@const profile = c.profiles}
								<div class="flex gap-3">
									<div class="w-9 h-9 rounded-full bg-[#F0F0F0] shrink-0 overflow-hidden flex items-center justify-center text-[13px] font-bold text-[#888]">
										{#if profile?.avatar_url}
											<img src={profile.avatar_url} alt="" class="w-full h-full object-cover" />
										{:else}
											{(profile?.display_name ?? '?')[0].toUpperCase()}
										{/if}
									</div>
									<div class="flex-1">
										<p class="text-[12px] font-semibold text-[#333]">{profile?.display_name ?? '익명'}</p>
										<p class="text-[14px] text-[#555] mt-0.5 leading-relaxed">{c.content}</p>
										<p class="text-[11px] text-[#AAAAAA] mt-1">{formatKoDate(c.created_at)}</p>
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="py-20 text-center">
							<svg class="w-12 h-12 mx-auto text-[#DCDCDC] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
							</svg>
							<p class="text-[14px] text-[#BBBBBB]">첫 번째 댓글을 남겨보세요.</p>
						</div>
					{/if}
				{/if}
			</div>
		</div>

		<!-- ════════════════════════════════
		     RIGHT: 펀딩 사이드바 (sticky)
		════════════════════════════════ -->
		<div class="hidden lg:block w-[360px] shrink-0">
			<div class="sticky top-[calc(3.5rem+3rem)] space-y-3 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1 custom-scrollbar">

				<!-- ① 통계 카드 -->
				<div class="bg-white border border-[#EBEBEB] rounded-2xl p-5">

					<!-- 달성률 -->
					<div class="flex items-end gap-2 mb-1">
						<span class="text-[32px] font-black text-[#00C4C4] leading-none">{rate.toLocaleString()}%</span>
						<span class="text-[13px] text-[#888] mb-1">달성</span>
					</div>

					<!-- 프로그레스 바 -->
					<div class="h-2 bg-[#F0F0F0] rounded-full mb-4 overflow-hidden">
						<div class="h-full bg-[#00C4C4] rounded-full transition-all" style="width: {Math.min(rate, 100)}%"></div>
					</div>

					<!-- 통계 3개 -->
					<div class="grid grid-cols-3 gap-0 divide-x divide-[#F0F0F0] mb-4">
						<div class="pr-3">
							<p class="text-[16px] font-bold text-[#1A1A1A]">{formatShortKRW(project.current_amount)}</p>
							<p class="text-[11px] text-[#AAAAAA] mt-0.5">목표 {formatShortKRW(project.goal_amount)}</p>
						</div>
						<div class="px-3">
							<p class="text-[16px] font-bold text-[#1A1A1A]">{formatNumber(project.backer_count)}<span class="text-[13px] font-normal text-[#888]">명</span></p>
							<p class="text-[11px] text-[#AAAAAA] mt-0.5">후원자</p>
						</div>
						<div class="pl-3">
							{#if daysLeft !== null}
								<p class="text-[16px] font-bold text-[#1A1A1A]">D-{daysLeft}</p>
								<p class="text-[11px] text-[#AAAAAA] mt-0.5">남은 날</p>
							{:else}
								<p class="text-[16px] font-bold text-[#AAAAAA]">—</p>
								<p class="text-[11px] text-[#AAAAAA] mt-0.5">기간 없음</p>
							{/if}
						</div>
					</div>

					<!-- 공유 / 좋아요 / 신고 버튼 행 -->
					<div class="flex gap-2 mb-3">
						<button onclick={share}
							class="flex items-center gap-1.5 px-3 py-2 border border-[#EBEBEB] rounded-lg text-[12px] text-[#555] font-semibold hover:border-[#AAAAAA] transition-colors">
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
							</svg>
							공유
						</button>
						<button
							onclick={toggleLike}
							disabled={likeLoading}
							class="flex items-center gap-1.5 px-3 py-2 border rounded-lg text-[12px] font-semibold transition-colors disabled:opacity-60
								{isLiked ? 'border-[#FF5C35] text-[#FF5C35] bg-[#FFF3F0]' : 'border-[#EBEBEB] text-[#555] hover:border-[#FF5050] hover:text-[#FF5050]'}">
							<svg class="w-3.5 h-3.5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
							</svg>
							{isLiked ? '찜함' : '찜하기'}
						</button>
					</div>

					<!-- 후원하기 버튼 -->
					{#if isActive}
						<a href="/fund/{project.id}"
							class="block w-full text-center py-3.5 bg-[#00C4C4] text-white font-bold text-[16px] rounded-xl hover:bg-[#00AFAF] transition-colors">
							후원하기
						</a>
					{:else}
						<div class="w-full py-3.5 text-center bg-[#F5F5F5] text-[#AAAAAA] font-bold text-[15px] rounded-xl">
							{project.status === 'funded' ? '🎉 펀딩 성공' : '종료된 프로젝트'}
						</div>
					{/if}
				</div>

				<!-- ② 창작자 카드 -->
				{#if creator}
					<div class="bg-white border border-[#EBEBEB] rounded-2xl p-4">
						<p class="text-[11px] text-[#AAAAAA] font-semibold mb-2 uppercase tracking-wide">메이커</p>
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 rounded-full bg-[#F0F0F0] overflow-hidden shrink-0 flex items-center justify-center text-[14px] font-bold text-[#888]">
								{#if creator.avatar_url}
									<img src={creator.avatar_url} alt="" class="w-full h-full object-cover" />
								{:else}
									{(creator.display_name ?? '?')[0].toUpperCase()}
								{/if}
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-[14px] font-bold text-[#1A1A1A] truncate">{creator.display_name ?? '창작자'}</p>
								{#if creator.is_creator}
									<span class="text-[10px] px-1.5 py-0.5 bg-[#F0FDFD] text-[#00A0A0] rounded font-semibold">인증 메이커</span>
								{/if}
							</div>
						</div>
					</div>
				{/if}

				<!-- ③ 리워드 선택 -->
				{#if data.rewards.length > 0}
					<div class="bg-white border border-[#EBEBEB] rounded-2xl overflow-hidden">
						<div class="px-5 py-3 border-b border-[#F5F5F5] flex items-center justify-between">
							<span class="text-[14px] font-bold text-[#1A1A1A]">리워드 선택</span>
							{#if project.ends_at}
								<span class="text-[11px] text-[#AAAAAA]">
									~{new Date(project.ends_at).toLocaleDateString('ko-KR', { month:'long', day:'numeric' })}
								</span>
							{/if}
						</div>
						<div class="p-3 space-y-2">
							{#each data.rewards as reward}
								{@const soldOut = isSoldOut(reward)}
								{@const selected = selectedId === reward.id}
								{@const pct = reward.max_quantity ? Math.round((reward.claimed_count / reward.max_quantity) * 100) : null}
								<button
									onclick={() => { if (!soldOut && isActive) fundingCart.select(reward); }}
									disabled={soldOut || !isActive}
									class="w-full text-left p-4 rounded-xl border-2 transition-all
										{soldOut ? 'border-[#F0F0F0] opacity-50 cursor-not-allowed' :
										 selected ? 'border-[#00C4C4] bg-[#F0FDFD]' :
										 isActive ? 'border-[#EBEBEB] hover:border-[#CCCCCC] cursor-pointer' :
										 'border-[#EBEBEB] cursor-default'}"
								>
									<!-- 태그 뱃지 -->
									<div class="flex items-center gap-1.5 mb-2 flex-wrap">
										{#if reward.is_early_bird}
											<span class="px-2 py-0.5 bg-[#FFF3CD] text-[#996600] text-[10px] font-bold rounded-full">얼리버드</span>
										{/if}
										{#if pct !== null && pct >= 80 && !soldOut}
											<span class="px-2 py-0.5 bg-[#FFF0E6] text-[#E05000] text-[10px] font-bold rounded-full">마감 임박</span>
										{/if}
										{#if soldOut}
											<span class="px-2 py-0.5 bg-[#F0F0F0] text-[#888] text-[10px] font-bold rounded-full">품절</span>
										{/if}
									</div>

									<!-- 리워드 제목 -->
									<p class="text-[13px] font-semibold text-[#1A1A1A] leading-snug mb-2">{reward.title}</p>

									<!-- 금액 -->
									<p class="text-[18px] font-black text-[#1A1A1A] mb-2">{formatKRW(reward.amount)}</p>

									<!-- 수량 바 -->
									{#if reward.max_quantity !== null}
										<div class="mb-1.5">
											<div class="h-1 bg-[#F0F0F0] rounded-full overflow-hidden">
												<div class="h-full rounded-full transition-all
													{soldOut ? 'bg-[#CCCCCC]' : 'bg-[#00C4C4]'}"
													style="width: {Math.min(pct ?? 0, 100)}%"></div>
											</div>
											<p class="text-[11px] text-[#AAAAAA] mt-1">
												{formatNumber(reward.claimed_count)} / {formatNumber(reward.max_quantity)}명 선택
											</p>
										</div>
									{:else}
										<p class="text-[11px] text-[#AAAAAA]">{formatNumber(reward.claimed_count)}명 선택 중</p>
									{/if}
								</button>
							{/each}

							<!-- 선택 후 후원하기 버튼 -->
							{#if fundingCart.item && isActive}
								<a href="/fund/{project.id}"
									class="block w-full text-center py-3 bg-[#00C4C4] text-white font-bold text-[14px] rounded-xl hover:bg-[#00AFAF] transition-colors shadow-md">
									{formatKRW(fundingCart.total)} 후원하기
								</a>
							{:else if !data.isLoggedIn && isActive}
								<a href="/auth/login?next=/projects/{project.slug}"
									class="block w-full text-center py-3 border-2 border-[#00C4C4] text-[#00C4C4] font-bold text-[14px] rounded-xl hover:bg-[#F0FDFD] transition-colors">
									로그인하고 후원하기
								</a>
							{/if}
						</div>
					</div>
				{/if}

			</div>
		</div>

	</div>
</div>

<!-- 모바일 하단 고정 후원 버튼 -->
{#if isActive}
	<div class="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#EBEBEB] px-4 py-3 safe-area-pb">
		<a href="/fund/{project.id}"
			class="block w-full text-center py-3.5 bg-[#00C4C4] text-white font-bold text-[16px] rounded-xl hover:bg-[#00AFAF] transition-colors">
			후원하기
		</a>
	</div>
	<!-- 모바일 푸터 가림 방지 패딩 -->
	<div class="lg:hidden h-20"></div>
{/if}

<style>
	/* 사이드바 스크롤바 얇게 */
	.custom-scrollbar::-webkit-scrollbar { width: 3px; }
	.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
	.custom-scrollbar::-webkit-scrollbar-thumb { background: #DCDCDC; border-radius: 999px; }

	/* 스토리 본문 스타일 */
	:global(.project-story img) { max-width: 100%; border-radius: 0.75rem; margin: 1.5rem 0; }
	:global(.project-story h2) { font-size: 1.2rem; font-weight: 700; margin: 2rem 0 0.75rem; color: #1A1A1A; }
	:global(.project-story h3) { font-size: 1.05rem; font-weight: 700; margin: 1.5rem 0 0.5rem; color: #333; }
	:global(.project-story p)  { margin-bottom: 1rem; }
	:global(.project-story ul, .project-story ol) { padding-left: 1.5rem; margin-bottom: 1rem; }
	:global(.project-story li) { margin-bottom: 0.25rem; }
	:global(.project-story iframe) { width: 100%; aspect-ratio: 16/9; border-radius: 0.75rem; margin: 1.5rem 0; }
</style>
