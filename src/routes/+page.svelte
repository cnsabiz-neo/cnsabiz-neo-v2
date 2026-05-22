<script lang="ts">
	import CampaignCard from '$lib/components/campaign/CampaignCard.svelte';
	import CategoryNav from '$lib/components/campaign/CategoryNav.svelte';
	import logo from '$lib/assets/logo.png';

	let { data } = $props();

	/** 히어로 배너 슬라이더 */
	let heroIdx = $state(0);
	const heroBanners = [
		{
			image: '/banners/banner1.jpg',
			tag: '제4회 충남 청소년 창업경진대회',
			title: '수상팀의 빛나는 아이디어,\n지금 후원하세요',
			sub: '충청남도교육청 주최 창업경진대회 수상작을 만나보세요',
			badge: '🏆 수상',
		},
		{
			image: '/banners/banner2.jpg',
			tag: '비즈쿨 × CNSA 창업 아이디어 발표회',
			title: '세상에 없던 아이디어를\n가장 먼저 만나다',
			sub: '창업 아이디어 발표회에서 펼쳐진 학생들의 도전',
			badge: '',
		},
		{
			image: '/banners/banner3.jpg',
			tag: '2024 청소년 비즈쿨',
			title: '당신의 한 표가\n프로젝트를 살린다',
			sub: '충남삼성고 비즈쿨과 함께하는 크라우드펀딩 플랫폼',
			badge: 'HOT',
		},
	];

	/** 실시간 베스트 탭 */
	let bestTab = $state<'funding' | 'open' | 'store'>('funding');

	/** 퀵 메뉴 아이콘 (와디즈 스타일) */
	const quickMenus = [
		{ icon: '♻️', label: '다시쓰다', href: '/discover?tag=reuse' },
		{ icon: '🎁', label: '추가증정', href: '/discover?tag=bonus' },
		{ icon: '🆕', label: '최초공개', href: '/discover?tag=exclusive' },
		{ icon: '☀️', label: '여름준비', href: '/discover?tag=summer' },
		{ icon: '🛒', label: '소복마켓', href: '/discover?tag=market' },
		{ icon: '🎯', label: '펀딩체험단', href: '/discover?tag=trial' },
		{ icon: '🏷️', label: '쿠폰', href: '/my/coupons' },
		{ icon: '⏰', label: '마감임박', href: '/discover?sort=closing' },
		{ icon: '⭐', label: '메이커추천', href: '/discover?sort=maker' },
		{ icon: '🏠', label: '메이커센터', href: '/dashboard' },
	];

	/** 자동 슬라이드 */
	import { onMount, onDestroy } from 'svelte';
	let autoSlide: ReturnType<typeof setInterval>;
	onMount(() => {
		autoSlide = setInterval(() => {
			heroIdx = (heroIdx + 1) % heroBanners.length;
		}, 4000);
	});
	onDestroy(() => clearInterval(autoSlide));

	function prevSlide() {
		heroIdx = (heroIdx - 1 + heroBanners.length) % heroBanners.length;
	}
	function nextSlide() {
		heroIdx = (heroIdx + 1) % heroBanners.length;
	}

</script>

<svelte:head>
	<title>큰사비즈 — 충남삼성고 크라우드펀딩 플랫폼</title>
	<meta name="description" content="큰사비즈에서 충남삼성고 학생들의 혁신적인 아이디어와 프로젝트를 만나보세요." />
</svelte:head>

<!-- ═══════════════════════════════════════════
     검색 바 섹션 — 헤더 바로 아래 (홈 전용)
═══════════════════════════════════════════ -->
<section class="bg-white border-b border-[#EBEBEB] py-4">
	<div class="max-w-[1200px] mx-auto px-4 flex items-center justify-center">
		<div class="w-full max-w-[640px] flex items-center border-2 border-[#CCCCCC] rounded-full px-5 py-3 bg-white hover:border-[#00C4C4] focus-within:border-[#00C4C4] transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.07)]">
			<input
				type="text"
				placeholder="새로운 일상이 필요하신가요?"
				class="flex-1 text-[15px] outline-none placeholder-[#AAAAAA] text-[#1A1A1A] bg-transparent"
			/>
			<button class="ml-3 w-8 h-8 flex items-center justify-center rounded-full bg-[#00C4C4] hover:bg-[#00AFAF] transition-colors shrink-0">
				<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
				</svg>
			</button>
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════
     퀵 메뉴 아이콘
═══════════════════════════════════════════ -->
<section class="bg-white py-4 border-b border-[#EBEBEB]">
	<div class="max-w-[1200px] mx-auto px-4">
		<div class="flex items-start gap-0 overflow-x-auto scrollbar-hide">
			{#each quickMenus as menu}
				<a
					href={menu.href}
					class="shrink-0 flex flex-col items-center gap-2 px-3 py-1 hover:opacity-75 transition-opacity min-w-[72px]"
				>
					<div class="w-[52px] h-[52px] rounded-full bg-[#F4F4F4] flex items-center justify-center text-[22px] shadow-sm border border-[#EDEDED]">
						{menu.icon}
					</div>
					<span class="text-[11px] text-[#1A1A1A] font-medium text-center whitespace-nowrap leading-tight">
						{menu.label}
					</span>
				</a>
			{/each}
		</div>
	</div>
</section>

<!-- ═══════════════════════════════════════════
     모바일 전용: 필터 탭 (펀딩+, 오픈예정, 스토어)
═══════════════════════════════════════════ -->
<section class="md:hidden bg-white border-b border-[#EBEBEB]">
	<div class="flex items-center gap-2 px-4 py-2.5 overflow-x-auto scrollbar-hide">
		<!-- 검색 -->
		<a href="/discover"
			class="shrink-0 flex items-center gap-1.5 px-3.5 py-2 border border-[#DEDEDE] rounded-xl text-[13px] text-[#444] font-medium hover:border-[#00C4C4] hover:text-[#00C4C4] transition-colors">
			<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
			</svg>
		</a>
		<!-- 펀딩+ -->
		<a href="/discover"
			class="shrink-0 flex items-center gap-1.5 px-3.5 py-2 border border-[#DEDEDE] rounded-xl text-[13px] text-[#444] font-medium hover:border-[#00C4C4] hover:text-[#00C4C4] transition-colors">
			<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
			</svg>
			펀딩<sup class="text-[10px] text-[#00C4C4] font-black">+</sup>
		</a>
		<!-- 오픈예정 -->
		<a href="/discover?tab=open"
			class="shrink-0 flex items-center gap-1.5 px-3.5 py-2 border border-[#DEDEDE] rounded-xl text-[13px] text-[#444] font-medium hover:border-[#00C4C4] hover:text-[#00C4C4] transition-colors">
			<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
			</svg>
			오픈예정
		</a>
		<!-- 스토어 -->
		<a href="/discover?tab=store"
			class="shrink-0 flex items-center gap-1.5 px-3.5 py-2 border border-[#DEDEDE] rounded-xl text-[13px] text-[#444] font-medium hover:border-[#00C4C4] hover:text-[#00C4C4] transition-colors">
			<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
			</svg>
			스토어
		</a>
		<!-- 당큰마켓 -->
		<a href="/market"
			class="shrink-0 flex items-center gap-1.5 px-3.5 py-2 border border-[#DEDEDE] rounded-xl text-[13px] text-[#444] font-medium hover:border-[#00C4C4] hover:text-[#00C4C4] transition-colors">
			🏪 애프터 마켓
		</a>
	</div>
</section>

<!-- ═══════════════════════════════════════════
     카테고리 탭 네비 (데스크톱만)
═══════════════════════════════════════════ -->
<section class="hidden md:block bg-white">
	<div class="max-w-[1200px] mx-auto px-4">
		<CategoryNav categories={data.categories} />
	</div>
</section>

<!-- ═══════════════════════════════════════════
     메인 콘텐츠: 히어로 + 베스트 + 취향 맞춤
     (와디즈 레이아웃: 모두 같은 섹션 내에 연속 배치)
═══════════════════════════════════════════ -->
<section class="bg-white pt-5 pb-8">
	<div class="max-w-[1200px] mx-auto px-4">

		<!-- ── Row: 히어로 슬라이더(좌) + 실시간 베스트(우) — 데스크톱 전용 ── -->
		<div class="hidden md:flex gap-4 items-stretch mb-0">

			<!-- 히어로 배너 슬라이더 -->
			<div class="relative flex-1 min-w-0 rounded-[8px] overflow-hidden" style="height: 320px;">
				{#each heroBanners as banner, i}
					<div
						class="absolute inset-0 transition-opacity duration-700"
						style="opacity: {heroIdx === i ? 1 : 0}; pointer-events: {heroIdx === i ? 'auto' : 'none'};"
					>
						<!-- 배경 사진 (블러 처리) -->
						<div class="absolute inset-0 overflow-hidden">
							<img
								src={banner.image}
								alt=""
								class="w-full h-full object-cover object-center scale-110"
								style="filter: blur(4px);"
								draggable="false"
							/>
						</div>
						<!-- 어두운 오버레이 (전체) -->
						<div class="absolute inset-0 bg-black/50"></div>
						<!-- 하단 그라디언트 (텍스트 가독성 강화) -->
						<div class="absolute inset-0" style="background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.05) 100%);"></div>

						<!-- 콘텐츠 -->
						<div class="relative z-10 flex flex-col justify-end h-full px-14 py-8">
							{#if banner.tag}
								<span class="inline-block self-start mb-3 px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-[11px] font-semibold rounded-full border border-white/30">
									{banner.tag}
								</span>
							{/if}
							{#if banner.badge}
								<span class="inline-block self-start mb-2 px-2 py-0.5 bg-[#00C4C4]/80 text-white text-[10px] font-black rounded-sm tracking-wide">
									{banner.badge}
								</span>
							{/if}
							<h2 class="text-white text-[26px] font-extrabold leading-tight whitespace-pre-line mb-2" style="text-shadow: 0 2px 12px rgba(0,0,0,0.5);">
								{banner.title}
							</h2>
							<p class="text-white/75 text-[13px] mb-5" style="text-shadow: 0 1px 4px rgba(0,0,0,0.4);">{banner.sub}</p>
							<a href="/discover" class="self-start px-5 py-2 bg-white text-[#1A1A1A] text-[13px] font-semibold rounded-full hover:bg-[#F0F0F0] transition-colors shadow-md">
								자세히 보기
							</a>
						</div>
					</div>
				{/each}

				<!-- 이전/다음 버튼 -->
				<button
					onclick={prevSlide}
					class="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
					aria-label="이전"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
					</svg>
				</button>
				<button
					onclick={nextSlide}
					class="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
					aria-label="다음"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
					</svg>
				</button>

				<!-- 점 인디케이터 -->
				<div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
					{#each heroBanners as _, i}
						<button
							onclick={() => heroIdx = i}
							class="h-1.5 rounded-full transition-all {heroIdx === i ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}"
							aria-label="배너 {i+1}"
						></button>
					{/each}
				</div>
			</div>

			<!-- 실시간 베스트 패널 (우) -->
			<div class="w-[300px] shrink-0 border border-[#EBEBEB] rounded-[8px] overflow-hidden flex flex-col">
				<div class="px-4 pt-4 pb-0">
					<h3 class="text-[15px] font-bold text-[#1A1A1A] mb-3">실시간 베스트</h3>
					<div class="flex border-b border-[#EBEBEB] -mx-4 px-4 gap-1">
						{#each [['funding','펀딩/프리오더'],['open','오픈예정'],['store','스토어']] as [tab, label]}
							<button
								onclick={() => bestTab = tab as 'funding'|'open'|'store'}
								class="text-[12px] font-medium pb-2 px-1 border-b-2 transition-colors -mb-px
									{bestTab === tab ? 'border-[#1A1A1A] text-[#1A1A1A]' : 'border-transparent text-[#999] hover:text-[#555]'}"
							>
								{label}
							</button>
						{/each}
					</div>
				</div>
				<div class="flex-1 overflow-y-auto py-1">
					{#if data.trending.length > 0}
						{#each data.trending.slice(0, 5) as project, i}
							<a href="/projects/{project.slug}" class="flex items-start gap-3 px-4 py-3 hover:bg-[#FAFAFA] transition-colors">
								<span class="shrink-0 w-5 text-[13px] font-bold text-[#1A1A1A] mt-0.5">{i + 1}</span>
								<div class="flex-1 min-w-0">
									<p class="text-[12px] text-[#1A1A1A] leading-snug line-clamp-2 mb-1">{project.title}</p>
									<span class="text-[12px] font-bold text-[#00C4C4]">
										{Math.round(project.current_amount / project.goal_amount * 100).toLocaleString('ko-KR')}% 달성
									</span>
								</div>
							</a>
						{/each}
					{:else}
						<div class="flex flex-col items-center justify-center h-full py-10 text-center px-4">
							<p class="text-[13px] text-[#BBB]">아직 진행 중인 프로젝트가 없어요</p>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- ── 취향 맞춤 프로젝트 ── -->
		{#if data.featured.length > 0 || data.trending.length > 0}
			<!-- 데스크톱: 히어로 바로 아래 -->
			<div class="hidden md:block mt-7">
				<div class="flex items-center justify-between mb-4">
					<div>
						<h2 class="text-[17px] font-bold text-[#1A1A1A]">취향 맞춤 프로젝트</h2>
						<p class="text-[12px] text-[#999] mt-0.5">지금 함께 만드는 성공</p>
					</div>
					<a href="/discover" class="text-[13px] text-[#999] hover:text-[#1A1A1A] flex items-center gap-1 transition-colors">
						전체 보기
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
						</svg>
					</a>
				</div>
				<div class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
					{#each [...data.featured, ...data.trending].slice(0, 10) as project}
						<CampaignCard {project} />
					{/each}
				</div>
			</div>

			<!-- 모바일: 풀너비 카드 목록 -->
			<div class="md:hidden -mx-4">
				<div class="flex items-center justify-between px-4 pt-2 pb-3">
					<div>
						<h2 class="text-[16px] font-bold text-[#1A1A1A]">취향 맞춤 프로젝트</h2>
						<p class="text-[11px] text-[#999] mt-0.5">지금 함께 만드는 성공</p>
					</div>
					<a href="/discover" class="text-[12px] text-[#999] flex items-center gap-0.5">
						전체 보기 <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
					</a>
				</div>
				<div class="flex flex-col divide-y divide-[#F0F0F0]">
					{#each [...data.featured, ...data.trending].slice(0, 8) as project}
						{@const rate = Math.round(project.current_amount / project.goal_amount * 100)}
						{@const daysLeft = project.ends_at ? Math.max(0, Math.ceil((new Date(project.ends_at).getTime() - Date.now()) / 86400000)) : null}
						<a href="/projects/{project.slug}" class="block bg-white">
							<!-- 이미지 -->
							<div class="aspect-[16/9] overflow-hidden bg-[#F4F4F4]">
								{#if project.thumbnail_url}
									<img src={project.thumbnail_url} alt={project.title} class="w-full h-full object-cover" loading="lazy" />
								{:else}
									<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#E6FAFA] to-[#C5F5F5]">
										<svg class="w-12 h-12 text-[#00C4C4] opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
										</svg>
									</div>
								{/if}
							</div>
							<!-- 정보 -->
							<div class="px-4 py-3">
								<div class="flex items-center gap-2 mb-1.5">
									<span class="text-[18px] font-black text-[#00C4C4]">{rate.toLocaleString()}% 달성</span>
									{#if project.current_amount > 0}
										<span class="px-1.5 py-0.5 bg-[#F0FDFD] text-[#007A7A] text-[11px] font-semibold rounded">
											{project.current_amount >= 10000000
												? Math.round(project.current_amount / 10000000) + '천만 원+'
												: project.current_amount >= 10000
													? Math.round(project.current_amount / 10000) + '만 원+'
													: project.current_amount.toLocaleString() + '원'}
										</span>
									{/if}
									{#if daysLeft !== null}
										<span class="px-1.5 py-0.5 bg-[#FFF3F0] text-[#CC4400] text-[11px] font-semibold rounded">{daysLeft}일 남음</span>
									{/if}
								</div>
								<p class="text-[14px] font-medium text-[#1A1A1A] leading-snug line-clamp-2 mb-2">{project.title}</p>
								{#if project.profiles}
									<p class="text-[12px] text-[#888]">{project.profiles.display_name ?? ''}</p>
								{/if}
							</div>
						</a>
					{/each}
				</div>
			</div>
		{/if}

		<!-- ── 인기 펀딩 (데스크톱만) ── -->
		{#if data.trending.length > 0}
			<div class="hidden md:block mt-10">
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-[17px] font-bold text-[#1A1A1A]">지금 인기 있는 펀딩</h2>
					<a href="/discover" class="text-[13px] text-[#999] hover:text-[#1A1A1A] flex items-center gap-1 transition-colors">
						전체 보기
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
						</svg>
					</a>
				</div>
				<div class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
					{#each data.trending as project}
						<CampaignCard {project} />
					{/each}
				</div>
			</div>
		{/if}

	</div>
</section>

<!-- ═══════════════════════════════════════════
     프로젝트 없을 때 (비어있는 상태)
═══════════════════════════════════════════ -->
{#if data.trending.length === 0 && data.featured.length === 0}
	<!-- 프로젝트 없을 때 빈 상태 안내 -->
	<section class="bg-white py-6">
		<div class="max-w-[1200px] mx-auto px-4">
			<!-- 필터 탭 -->
			<div class="flex items-center gap-2 mb-5 overflow-x-auto scrollbar-hide pb-1">
				{#each [['전체',''], ['BEST 펀딩','best'], ['슈퍼메이커','super']] as [label, val]}
					<button
						class="shrink-0 w-12 h-12 rounded-full flex flex-col items-center justify-center text-[10px] font-bold border-2 transition-colors
							{val === '' ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white' : 'border-[#EBEBEB] text-[#888] hover:border-[#1A1A1A] hover:text-[#1A1A1A]'}"
					>
						{label}
					</button>
				{/each}
				{#each ['테크·가전','패션','뷰티','홈·리빙','스포츠·아웃도어','푸드','도서'] as cat}
					<a
						href="/discover?category={cat}"
						class="shrink-0 flex flex-col items-center gap-1 px-3"
					>
						<div class="w-12 h-12 rounded-full bg-[#F4F4F4] flex items-center justify-center text-[20px]">
							{({'테크·가전':'💻','패션':'👗','뷰티':'💄','홈·리빙':'🏠','스포츠·아웃도어':'⛺','푸드':'🍽️','도서':'📚'})[cat] ?? '📦'}
						</div>
						<span class="text-[10px] text-[#555] whitespace-nowrap">{cat}</span>
					</a>
				{/each}
			</div>

			<!-- 정렬 바 -->
			<div class="flex items-center justify-between mb-5">
				<label class="flex items-center gap-1.5 cursor-pointer">
					<input type="checkbox" class="w-3.5 h-3.5 accent-[#00C4C4]" />
					<span class="text-[12px] text-[#555]">슈퍼메이커</span>
				</label>
				<div class="flex gap-3 text-[12px] text-[#888]">
					{#each ['추천순','인기순','모집금액순','마감임박순','최신순'] as sort}
						<button class="hover:text-[#1A1A1A] first:font-semibold first:text-[#1A1A1A]">{sort}</button>
					{/each}
				</div>
			</div>

			<!-- 더미 카드 그리드 -->
			<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
				{#each Array(10) as _, i}
					<div class="rounded-[4px] overflow-hidden animate-pulse">
						<div class="aspect-[4/3] bg-[#F0F0F0] rounded-[4px]"></div>
						<div class="pt-2.5">
							<div class="h-3 bg-[#F0F0F0] rounded w-1/3 mb-2"></div>
							<div class="h-3.5 bg-[#F0F0F0] rounded w-full mb-1.5"></div>
							<div class="h-3.5 bg-[#F0F0F0] rounded w-2/3 mb-3"></div>
							<div class="h-4 bg-[#E8F9F9] rounded w-1/2"></div>
						</div>
					</div>
				{/each}
			</div>

			<div class="mt-16 text-center">
				<p class="text-[14px] text-[#999] mb-2">아직 등록된 프로젝트가 없어요</p>
				<p class="text-[12px] text-[#BBB] mb-6">첫 번째 창작자가 되어보세요!</p>
				<a href="/create" class="btn-brand inline-flex px-6 py-2.5 text-[14px]">
					프로젝트 시작하기
				</a>
			</div>
		</div>
	</section>
{/if}

<!-- ═══════════════════════════════════════════
     하단 배너: 큰사비즈 메이커 CTA
═══════════════════════════════════════════ -->
<section class="border-t border-[#EBEBEB] py-14 mt-4" style="background: linear-gradient(135deg, #E6FAFA 0%, #F0FDFD 60%, #ffffff 100%);">
	<div class="max-w-[1200px] mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8">
		<div class="flex items-start gap-4">
			<img src={logo} alt="큰사비즈" class="h-12 w-auto mt-1 shrink-0 opacity-90" />
			<div>
				<h2 class="text-[22px] font-bold text-[#1A1A1A] mb-2">큰사비즈에서 시작해보세요</h2>
				<p class="text-[14px] text-[#666] leading-relaxed max-w-md">
					충남삼성고 학생들의 아이디어를 현실로. 비즈쿨과 함께하는 크라우드펀딩 플랫폼에서 첫 프로젝트를 시작하세요.
				</p>
			</div>
		</div>
		<div class="flex flex-col sm:flex-row gap-3 shrink-0">
			<a href="/create" class="btn-brand-solid px-7 py-3 text-[14px]">
				프로젝트 만들기
			</a>
			<a
				href="/discover"
				class="inline-flex items-center justify-center px-7 py-3 rounded-[4px] text-[14px] font-semibold border border-[#00C4C4] text-[#00C4C4] hover:bg-[#E6FAFA] transition-colors"
			>
				펀딩 탐색하기
			</a>
		</div>
	</div>
</section>
