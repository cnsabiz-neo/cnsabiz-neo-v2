<script lang="ts">
	import { getAuthContext } from '$lib/stores/auth.svelte';
	import { page } from '$app/stores';
	import logo from '$lib/assets/logo.png';

	const auth = getAuthContext();

	/** 현재 경로 기준으로 활성 탭 판단 */
	const isHome = $derived($page.url.pathname === '/');

	let moreOpen = $state(false);
	let searchQuery = $state('');

	const navItems = [
		{ label: '펀딩', plus: true, href: '/discover' },
		{ label: '스토어',           href: '/discover?tab=store' },
		{ label: '애프터 마켓',        href: '/market' },
	];

	/** "더보기" 드롭다운 메뉴 */
	const moreMenu: {
		title: string;
		items: { label: string; href: string; external?: boolean }[];
	}[] = [
		{
			title: '개발자',
			items: [
				{ label: '개발자 소개',   href: '/developers' },
				{ label: 'GitHub 저장소', href: 'https://github.com/cnsabiz-neo/cnsabiz-neo-v2', external: true },
				{ label: '문의하기',      href: 'mailto:cnsabiz@cnsa.hs.kr', external: true },
			],
		},
		{
			title: '교내 대회',
			items: [
				{ label: '프로젝트 둘러보기', href: '/discover' },
				{ label: '프로젝트 만들기',   href: '/create' },
				{ label: '내 후원 내역',      href: '/my/fundings' },
			],
		},
	];
</script>

<header class="sticky top-0 z-50 bg-white border-b border-[#EBEBEB]">
	<div class="max-w-[1200px] mx-auto px-4 h-[56px] flex items-center gap-4">

		<!-- 로고 -->
		<a href="/" class="shrink-0 mr-2 flex items-center gap-2 hover:opacity-85 transition-opacity">
			<img src={logo} alt="큰사비즈 로고" class="h-8 w-auto" />
			<span class="text-[19px] font-black tracking-tight text-[#1A1A1A] leading-none">큰사비즈</span>
		</a>

		<!-- 좌측 네비 -->
		<nav class="hidden md:flex items-center gap-0 shrink-0">
			{#each navItems as item}
				<a
					href={item.href}
					class="px-3 py-1 text-[14px] font-medium transition-colors flex items-center gap-0.5
						{$page.url.pathname === item.href.split('?')[0] && (!item.href.includes('?') || $page.url.search.includes(item.href.split('?')[1] ?? ''))
							? 'text-[#00C4C4] font-semibold'
							: 'text-[#1A1A1A] hover:text-[#00C4C4]'}"
				>
					{item.label}{#if item.plus}<sup class="text-[10px] font-black ml-0.5 text-[#00C4C4]">+</sup>{/if}
				</a>
			{/each}
			<div class="relative">
				<button
					onclick={() => moreOpen = !moreOpen}
					class="px-3 py-1 text-[14px] font-medium text-[#1A1A1A] hover:text-[#00C4C4] flex items-center gap-0.5"
				>
					더보기
					<svg class="w-3.5 h-3.5 mt-0.5 transition-transform {moreOpen ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/>
					</svg>
				</button>

				{#if moreOpen}
					<!-- 바깥 클릭 시 닫기 -->
					<button
						class="fixed inset-0 z-40 cursor-default"
						onclick={() => moreOpen = false}
						aria-label="메뉴 닫기"
						tabindex="-1"
					></button>

					<!-- 드롭다운 패널 -->
					<div class="absolute left-0 top-full mt-3 z-50 w-[420px] bg-white border border-[#EBEBEB] rounded-2xl shadow-lg p-6 grid grid-cols-2 gap-x-8 gap-y-2">
						{#each moreMenu as col}
							<div>
								<p class="text-[12px] font-semibold text-[#AAAAAA] mb-3">{col.title}</p>
								<ul class="space-y-1">
									{#each col.items as item}
										<li>
											<a
												href={item.href}
												target={item.external ? '_blank' : undefined}
												rel={item.external ? 'noopener noreferrer' : undefined}
												onclick={() => moreOpen = false}
												class="flex items-center gap-1 py-1.5 text-[14px] text-[#1A1A1A] hover:text-[#00C4C4] transition-colors"
											>
												{item.label}
												{#if item.external}
													<svg class="w-3 h-3 text-[#BBBBBB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
													</svg>
												{/if}
											</a>
										</li>
									{/each}
								</ul>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</nav>

		<!-- 검색창은 헤더에서 제거 — 홈 페이지 아래 섹션에 별도 배치 -->
		<div class="flex-1"></div>

		<!-- 우측 액션 -->
		<div class="flex items-center gap-1 shrink-0 ml-auto">
			<!-- 국기 -->
			<button class="hidden md:flex p-1.5 text-[#555] hover:text-[#1A1A1A] text-[13px] items-center gap-1 rounded hover:bg-[#F4F4F4]">
				<span class="text-base leading-none">🇰🇷</span>
			</button>

			<!-- 좋아요 -->
			<button class="p-1.5 text-[#555] hover:text-[#1A1A1A] rounded hover:bg-[#F4F4F4]" aria-label="찜 목록">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
				</svg>
			</button>

			<!-- 사용자 아이콘 -->
			{#if auth.isLoggedIn}
				<a href="/my/profile" class="p-1.5 rounded hover:bg-[#F4F4F4]" aria-label="내 프로필">
					{#if auth.user?.user_metadata?.avatar_url}
						<img src={auth.user.user_metadata.avatar_url} alt="프로필" class="w-5 h-5 rounded-full object-cover" />
					{:else}
						<div class="w-5 h-5 rounded-full bg-[#00C4C4] flex items-center justify-center text-white text-[10px] font-bold">
							{(auth.user?.email ?? 'U')[0].toUpperCase()}
						</div>
					{/if}
				</a>
				<a href="/dashboard" class="hidden md:flex px-2 py-1 text-[13px] text-[#555] hover:text-[#1A1A1A] rounded hover:bg-[#F4F4F4]">
					메이커홈
				</a>
			{:else}
				<button class="p-1.5 text-[#555] hover:text-[#1A1A1A] rounded hover:bg-[#F4F4F4]" aria-label="로그인">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
					</svg>
				</button>
				<a href="/auth/login" class="hidden md:inline-flex text-[13px] font-medium text-[#555] hover:text-[#1A1A1A] px-1">
					로그인/회원가입
				</a>
				<a href="/dashboard" class="hidden md:flex items-center gap-1 px-2 py-1 text-[13px] text-[#555] hover:text-[#1A1A1A] rounded hover:bg-[#F4F4F4]">
					<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
					</svg>
					메이커홈
				</a>
			{/if}

			<!-- 프로젝트 만들기 버튼 -->
			<a href="/create" class="btn-brand hidden md:inline-flex ml-1">
				프로젝트 만들기
			</a>

			<!-- 모바일 햄버거 -->
			<button class="md:hidden p-1.5 text-[#555] hover:text-[#1A1A1A]" aria-label="메뉴">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
				</svg>
			</button>
		</div>
	</div>
</header>
