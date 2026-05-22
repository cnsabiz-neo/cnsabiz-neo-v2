<script lang="ts">
	import type { Database } from '$lib/supabase/types';

	type Category = Database['public']['Tables']['categories']['Row'];

	let { categories, active = null }: { categories: Category[]; active?: string | null } = $props();

	/** 카테고리 이모지 아이콘 매핑 */
	const iconMap: Record<string, string> = {
		'테크·가전': '💻', '패션': '👗', '뷰티': '💄', '홈·리빙': '🏠',
		'스포츠·아웃도어': '⛺', '푸드': '🍽️', '도서': '📚',
		'전자책·클래스': '🎓', '디자인': '🎨', '반려동물': '🐾',
		'아트': '🖼️', '캐릭터·굿즈': '🧸', '영화·음악': '🎵', '키즈': '🧒',
		'게임': '🎮', '여행': '✈️', '건강': '💪',
	};

	/** 서브카테고리 정적 매핑 */
	const subMap: Record<string, string[][]> = {
		'테크·가전': [
			['테크·가전 전체', 'DIY', '로봇'],
			['생활가전', '엔터테인먼트가전', 'App·Web'],
			['주방가전', '웨어러블'],
			['스마트가전', '주변기기'],
		],
		'패션': [
			['패션 전체', '의류', '키즈'],
			['가방', '신발', '럭셔리'],
			['패션소품', '아이웨어'],
			['주얼리', '언더웨어'],
		],
		'뷰티': [
			['뷰티 전체', '스킨케어', '선케어'],
			['메이크업', '바디케어'],
			['헤어케어', '향수'],
			['네일', '구강케어'],
		],
		'홈·리빙': [
			['홈·리빙 전체', '가구', '수납'],
			['조명', '침구'],
			['주방', '욕실'],
			['인테리어', '청소'],
		],
		'스포츠·아웃도어': [
			['스포츠·아웃도어 전체', '캠핑'],
			['운동기구', '자전거'],
			['등산', '수상스포츠'],
			['스포츠의류', '골프'],
		],
		'푸드': [
			['푸드 전체', '건강식품'],
			['음료', '간편식'],
			['디저트', '주류'],
			['식재료', '농산물'],
		],
		'도서': [
			['도서 전체', '인문·사회'],
			['소설·에세이', '자기계발'],
			['경제·경영', '어린이'],
			['과학·기술', '만화'],
		],
		'전자책·클래스': [
			['클래스 전체', '어학'],
			['요리', '운동'],
			['미술·디자인', '음악'],
			['개발·IT', '비즈니스'],
		],
		'디자인': [
			['디자인 전체', '문구'],
			['아트프린트', '가방·파우치'],
			['의류·잡화', '리빙'],
			['스티커', '포스터'],
		],
		'반려동물': [
			['반려동물 전체', '강아지'],
			['고양이', '소동물'],
			['사료·간식', '용품'],
			['의류·액세서리', '장난감'],
		],
	};

	let hoveredSlug = $state<string | null>(null);
	let leaveTimer: ReturnType<typeof setTimeout>;

	function onEnter(slug: string) {
		clearTimeout(leaveTimer);
		hoveredSlug = slug;
	}

	function onLeave() {
		leaveTimer = setTimeout(() => { hoveredSlug = null; }, 120);
	}

	const dropdownOpen = $derived(hoveredSlug !== null);
	const dropdownSubs = $derived(
		hoveredSlug ? (subMap[categories.find(c => c.slug === hoveredSlug)?.name ?? ''] ?? []) : []
	);
</script>

<!-- ── 카테고리 탭 바 ── -->
<div class="relative border-b border-[#EBEBEB]">
	<div class="flex items-center overflow-x-auto scrollbar-hide">

		<!-- 전체 탭 -->
		<a
			href="/discover"
			class="shrink-0 flex flex-col items-center gap-1 px-4 py-3 text-center transition-colors relative
				{!active ? 'text-[#1A1A1A]' : 'text-[#999] hover:text-[#1A1A1A]'}"
		>
			<span class="text-[18px] leading-none">🔍</span>
			<span class="text-[11px] font-medium whitespace-nowrap">전체</span>
			{#if !active}
				<span class="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1A1A1A] rounded-full"></span>
			{/if}
		</a>

		{#each categories as cat}
			<div
				class="relative shrink-0"
				onmouseenter={() => onEnter(cat.slug)}
				onmouseleave={onLeave}
				role="none"
			>
				<a
					href="/discover?category={cat.slug}"
					class="flex flex-col items-center gap-1 px-4 py-3 text-center transition-colors relative block
						{active === cat.slug || hoveredSlug === cat.slug ? 'text-[#1A1A1A]' : 'text-[#999] hover:text-[#1A1A1A]'}"
				>
					<span class="text-[18px] leading-none">{iconMap[cat.name] ?? '📦'}</span>
					<span class="text-[11px] font-medium whitespace-nowrap">{cat.name}</span>
					{#if active === cat.slug || hoveredSlug === cat.slug}
						<span class="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1A1A1A] rounded-full"></span>
					{/if}
				</a>
			</div>
		{/each}
	</div>

	<!-- ── hover 드롭다운 패널 ── -->
	{#if dropdownOpen && dropdownSubs.length > 0}
		<div
			class="absolute top-full left-0 right-0 z-50 bg-white border-b border-[#EBEBEB] shadow-lg"
			onmouseenter={() => clearTimeout(leaveTimer)}
			onmouseleave={onLeave}
			role="none"
		>
			<div class="max-w-[1200px] mx-auto px-4 py-5">
				<div class="grid grid-cols-4 gap-x-8 gap-y-2">
					{#each dropdownSubs as col}
						<div class="space-y-2">
							{#each col as sub, i}
								<a
									href="/discover?category={hoveredSlug}&sub={encodeURIComponent(sub)}"
									class="block text-[13px] transition-colors
										{i === 0
											? 'font-bold text-[#1A1A1A] hover:text-[#00C4C4]'
											: 'text-[#555] hover:text-[#1A1A1A]'}"
								>
									{sub}
								</a>
							{/each}
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
