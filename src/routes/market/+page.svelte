<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { getAuthContext } from '$lib/stores/auth.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { DOMAIN_LABELS, type MarketItem } from '$lib/supabase/market';

	let { data, form } = $props();
	const auth = getAuthContext();

	// ── URL 파라미터 → 현재 필터 (서버에서 내려온 값 사용)
	const f = $derived(data.filters);

	// ── 로컬 입력 상태 (반영 전)
	let searchInput = $state(data.filters.q);
	let mobileFilterOpen = $state(false);
	let modal = $state<MarketItem | null>(null);
	let activeTab = $state<'중고거래' | '나눔' | '구함'>('중고거래');

	// ── URL 이동 헬퍼
	function navigate(updates: Record<string, string | number | boolean>, resetPage = true) {
		const params = new URLSearchParams($page.url.searchParams);
		for (const [k, v] of Object.entries(updates)) {
			if (v === 0 || v === '' || v === false) params.delete(k);
			else params.set(k, String(v));
		}
		if (resetPage) params.delete('page');
		goto(`/market?${params.toString()}`, { keepFocus: true });
	}

	function setDomain(v: number)  { navigate({ domain: v }); }
	function setClass(v: number)   { navigate({ class: v, group: 0 }); }
	function setGroup(v: number)   { navigate({ group: v }); }
	function setAvail(v: boolean)  { navigate({ avail: v ? '1' : '' }); }
	function setPage(p: number)    { navigate({ page: p }, false); window.scrollTo({ top: 0, behavior: 'smooth' }); }
	function submitSearch(e: SubmitEvent) {
		e.preventDefault();
		navigate({ q: searchInput.trim() });
	}
	function resetFilters() { goto('/market'); searchInput = ''; }

	// ── 페이지네이션 계산
	const totalPages = $derived(Math.ceil(data.total / data.pageSize));

	function pageNumbers(cur: number, total: number): (number | '…')[] {
		if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
		const pages: (number | '…')[] = [1];
		if (cur > 3) pages.push('…');
		for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
		if (cur < total - 2) pages.push('…');
		pages.push(total);
		return pages;
	}

	// ── 도메인 옵션
	const domains = [
		{ value: 0, label: '전체',   emoji: '🏪', desc: '' },
		{ value: 1, label: '1영역',  emoji: '📚', desc: '책·학습' },
		{ value: 2, label: '2영역',  emoji: '👕', desc: '의류·액세서리' },
		{ value: 3, label: '3영역',  emoji: '🎮', desc: '취미·굿즈' },
		{ value: 4, label: '4영역',  emoji: '🎁', desc: '선생님 애장품' },
	];
	const classes = [0,1,2,3,4,5,6,7,8,9,10,11,12];
	const groups  = [0,1,2,3,4,5];

	// ── 상태 헬퍼
	function itemStatus(p: MarketItem) {
		if (p.is_completed || p.status) return 'done';
		if (p.is_reserved) return 'reserved';
		return 'sale';
	}
	const statusMeta = {
		done:     { label: '거래완료', overlay: 'bg-black/45' },
		reserved: { label: '예약중',   overlay: 'bg-[#FF8C00]/70' },
		sale:     { label: '',         overlay: '' },
	};

	// ── 모달 권한
	const myEmail     = $derived(auth.user?.email ?? null);
	const isCnsa      = $derived(!!myEmail && myEmail.endsWith('@cnsa.hs.kr'));
	const isSeller    = $derived(!!modal && modal.uploaded_by === myEmail);
	const isBuyer     = $derived(!!modal && modal.reserved_by === myEmail);
	const canReserve  = $derived(!!modal && itemStatus(modal) === 'sale' && isCnsa && !isSeller);
	const canCancel   = $derived(!!modal && modal.is_reserved && (isSeller || isBuyer) && !modal.is_completed);
	const canComplete = $derived(!!modal && modal.is_reserved && isSeller && !modal.is_completed);

	// ── 폼 결과
	$effect(() => {
		if (!form) return;
		if ('error' in form && form.error) {
			toast.error(form.error as string);
		} else if ('success' in form) {
			const msgs: Record<string, string> = {
				reserve: '예약 완료!', cancelReserve: '예약이 취소됐습니다.', complete: '거래 완료!',
			};
			toast.success(msgs[(form as { action: string }).action] ?? '처리됐습니다.');
			invalidateAll();
			modal = null;
		}
	});

	const popular = ['교재', '에어팟', '키링', '교복', '책', '앨범', '볼펜', '인형'];
	const bgPalette = [
		'from-[#E6FAFA] to-[#B2EEEE]','from-[#EEF2FF] to-[#C7D2FE]',
		'from-[#FFF7ED] to-[#FED7AA]','from-[#F0FDF4] to-[#BBF7D0]',
		'from-[#FFF1F2] to-[#FECDD3]','from-[#F5F3FF] to-[#DDD6FE]',
		'from-[#ECFEFF] to-[#A5F3FC]','from-[#FFFBEB] to-[#FDE68A]',
	];
	function classLabel(n: number) { return n === 99 ? '선생님' : `${n}반`; }
</script>

<svelte:head>
	<title>애프터 마켓 — 충남삼성고</title>
</svelte:head>

<!-- ════════ 서브 헤더 ════════ -->
<div class="bg-white border-b border-[#EBEBEB] sticky top-14 z-20">
	<div class="max-w-[1200px] mx-auto px-4">
		<div class="flex items-center gap-3 py-3">
			<div class="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-[#F4F4F4] rounded-full text-[13px] font-bold">
				🏫 충남삼성고
			</div>
			<form onsubmit={submitSearch} class="flex-1 flex items-center border border-[#DCDCDC] rounded-full focus-within:border-[#00C4C4] focus-within:ring-2 focus-within:ring-[#00C4C420] transition-all">
				<input
					type="text" bind:value={searchInput}
					placeholder="애프터 마켓에서 검색"
					class="flex-1 px-4 py-2.5 text-[14px] outline-none bg-transparent"
				/>
				<button type="submit" class="px-3 text-[#AAAAAA] hover:text-[#00C4C4] transition-colors">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
					</svg>
				</button>
			</form>
			<button
				onclick={() => mobileFilterOpen = !mobileFilterOpen}
				class="lg:hidden shrink-0 flex items-center gap-1.5 px-3 py-2 border rounded-full text-[13px] font-medium transition-colors
					{mobileFilterOpen ? 'border-[#00C4C4] text-[#00C4C4] bg-[#E6FAFA]' : 'border-[#DCDCDC] text-[#444]'}"
			>
				<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h18M6 10h12M9 16h6"/>
				</svg>
				필터
			</button>
		</div>
		<div class="flex -mb-px">
			{#each ['중고거래','나눔','구함'] as tab}
				<button onclick={() => activeTab = tab as typeof activeTab}
					class="px-4 py-2.5 text-[14px] font-semibold border-b-2 transition-colors
						{activeTab === tab ? 'border-[#1A1A1A] text-[#1A1A1A]' : 'border-transparent text-[#999] hover:text-[#555]'}">
					{tab}
				</button>
			{/each}
		</div>
	</div>
</div>

<!-- 인기 검색어 -->
<div class="bg-white border-b border-[#EBEBEB]">
	<div class="max-w-[1200px] mx-auto px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
		<span class="shrink-0 text-[11px] text-[#AAAAAA] font-semibold">인기</span>
		{#each popular as kw}
			<button onclick={() => { searchInput = kw; navigate({ q: kw }); }}
				class="shrink-0 px-3 py-1 bg-[#F4F4F4] hover:bg-[#E6FAFA] hover:text-[#007A7A] text-[#555] text-[12px] font-medium rounded-full transition-colors">
				{kw}
			</button>
		{/each}
	</div>
</div>

<!-- 모바일 필터 -->
{#if mobileFilterOpen}
<div class="lg:hidden bg-white border-b border-[#EBEBEB] px-4 py-4 space-y-4">
	<label class="flex items-center gap-2 cursor-pointer">
		<input type="checkbox" checked={f.onlyAvail} onchange={e => setAvail((e.target as HTMLInputElement).checked)} class="w-4 h-4 accent-[#00C4C4]" />
		<span class="text-[13px] font-medium">거래 가능만 보기</span>
	</label>
	<div>
		<p class="text-[11px] font-bold text-[#AAAAAA] uppercase tracking-widest mb-2">영역</p>
		<div class="flex flex-wrap gap-2">
			{#each domains as d}
				<button onclick={() => setDomain(d.value)}
					class="px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors
						{f.domain === d.value ? 'bg-[#00C4C4] text-white border-[#00C4C4]' : 'bg-white text-[#555] border-[#DCDCDC]'}">
					{d.emoji} {d.label}{d.desc ? ` ${d.desc}` : ''}
				</button>
			{/each}
		</div>
	</div>
	<div>
		<p class="text-[11px] font-bold text-[#AAAAAA] uppercase tracking-widest mb-2">반</p>
		<div class="flex flex-wrap gap-2">
			{#each classes as c}
				<button onclick={() => setClass(c)}
					class="px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors
						{f.classNum === c ? 'bg-[#00C4C4] text-white border-[#00C4C4]' : 'bg-white text-[#555] border-[#DCDCDC]'}">
					{c === 0 ? '전체' : `${c}반`}
				</button>
			{/each}
		</div>
		{#if f.classNum !== 0}
			<div class="mt-3 pt-3 border-t border-[#F0F0F0]">
				<p class="text-[11px] font-bold text-[#AAAAAA] uppercase tracking-widest mb-2">{f.classNum}반 · 조</p>
				<div class="flex flex-wrap gap-2">
					{#each groups as g}
						<button onclick={() => setGroup(g)}
							class="px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors
								{f.groupNum === g ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'bg-white text-[#555] border-[#DCDCDC]'}">
							{g === 0 ? '전체 조' : `${g}조`}
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>
{/if}

<!-- ════════ 메인 ════════ -->
<div class="max-w-[1200px] mx-auto px-4 py-6 flex gap-6 items-start">

	<!-- 사이드바 (데스크톱) -->
	<aside class="hidden lg:block w-[200px] shrink-0 bg-white rounded-2xl border border-[#EBEBEB] p-5 sticky top-[124px]">
		<div class="flex items-center justify-between mb-4">
			<h3 class="text-[14px] font-bold text-[#1A1A1A]">필터</h3>
			<button onclick={resetFilters} class="text-[12px] text-[#999] hover:text-[#00C4C4] transition-colors">초기화</button>
		</div>

		<!-- 거래 가능만 -->
		<label class="flex items-center gap-2 mb-5 cursor-pointer">
			<div class="relative">
				<input type="checkbox" checked={f.onlyAvail} onchange={e => setAvail((e.target as HTMLInputElement).checked)} class="sr-only peer" />
				<div class="w-4 h-4 rounded border-2 border-[#DCDCDC] peer-checked:bg-[#00C4C4] peer-checked:border-[#00C4C4] transition-colors flex items-center justify-center">
					{#if f.onlyAvail}
						<svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
						</svg>
					{/if}
				</div>
			</div>
			<span class="text-[13px] text-[#444]">거래 가능만 보기</span>
		</label>

		<div class="border-t border-[#F0F0F0] mb-4"></div>

		<!-- 영역 -->
		<div class="mb-5">
			<p class="text-[11px] font-bold text-[#AAAAAA] uppercase tracking-widest mb-3">영역</p>
			<ul class="space-y-0.5">
				{#each domains as d}
					<li>
						<button onclick={() => setDomain(d.value)}
							class="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-[13px] transition-colors text-left
								{f.domain === d.value ? 'bg-[#E6FAFA] text-[#007A7A] font-semibold' : 'text-[#555] hover:bg-[#F7F7F7]'}">
							<span class="w-2 h-2 rounded-full shrink-0 {f.domain === d.value ? 'bg-[#00C4C4]' : 'border-2 border-[#DCDCDC]'}"></span>
							{d.emoji} {d.label}{d.desc ? ` · ${d.desc}` : ''}
						</button>
					</li>
				{/each}
			</ul>
		</div>

		<div class="border-t border-[#F0F0F0] mb-4"></div>

		<!-- 반 + 조 -->
		<div>
			<p class="text-[11px] font-bold text-[#AAAAAA] uppercase tracking-widest mb-3">반</p>
			<ul class="space-y-0.5">
				{#each classes as c}
					<li>
						<button onclick={() => setClass(c)}
							class="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-[13px] transition-colors text-left
								{f.classNum === c ? 'bg-[#E6FAFA] text-[#007A7A] font-semibold' : 'text-[#555] hover:bg-[#F7F7F7]'}">
							<span class="w-2 h-2 rounded-full shrink-0 {f.classNum === c ? 'bg-[#00C4C4]' : 'border-2 border-[#DCDCDC]'}"></span>
							<span class="flex-1">{c === 0 ? '전체' : `${c}반`}</span>
							{#if c !== 0 && f.classNum === c}
								<svg class="w-3 h-3 text-[#00C4C4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/>
								</svg>
							{/if}
						</button>

						<!-- 조 서브 -->
						{#if c !== 0 && f.classNum === c}
							<div class="ml-4 mt-1 mb-1 pl-3 border-l-2 border-[#D0F4F4] space-y-0.5">
								{#each groups as g}
									<button onclick={() => setGroup(g)}
										class="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] transition-colors text-left
											{f.groupNum === g ? 'bg-[#00C4C4]/10 text-[#007A7A] font-bold' : 'text-[#777] hover:bg-[#F4F4F4]'}">
										{#if f.groupNum === g}
											<span class="w-2 h-2 rounded-full bg-[#00C4C4] shrink-0"></span>
										{:else}
											<span class="w-2 h-2 rounded-full border-2 border-[#DCDCDC] shrink-0"></span>
										{/if}
										{g === 0 ? '전체 조' : `${g}조`}
									</button>
								{/each}
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		</div>
	</aside>

	<!-- 상품 영역 -->
	<main class="flex-1 min-w-0">

		<!-- 헤더 바 -->
		<div class="flex items-center justify-between mb-4">
			<h2 class="text-[15px] font-bold text-[#1A1A1A]">
				충남삼성고 {activeTab}
				<span class="ml-1.5 text-[13px] font-normal text-[#999]">총 {data.total.toLocaleString()}개</span>
			</h2>
			<!-- 활성 필터 뱃지 -->
			<div class="flex items-center gap-1.5 flex-wrap justify-end">
				{#if f.domain}
					<span class="px-2 py-0.5 bg-[#E6FAFA] text-[#007A7A] text-[11px] font-bold rounded-full">
						{domains.find(d => d.value === f.domain)?.emoji} {domains.find(d => d.value === f.domain)?.label}
					</span>
				{/if}
				{#if f.classNum}
					<span class="px-2 py-0.5 bg-[#E6FAFA] text-[#007A7A] text-[11px] font-bold rounded-full">
						{f.classNum}반{f.groupNum ? ` · ${f.groupNum}조` : ''}
					</span>
				{/if}
				{#if f.q}
					<span class="px-2 py-0.5 bg-[#F4F4F4] text-[#555] text-[11px] font-medium rounded-full">
						🔍 "{f.q}"
					</span>
				{/if}
			</div>
		</div>

		<!-- 그리드 -->
		{#if data.items.length > 0}
			<div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
				{#each data.items as item, i}
					{@const st = itemStatus(item)}
					{@const domInfo = DOMAIN_LABELS[item.domain]}
					<button onclick={() => modal = item}
						class="bg-white rounded-2xl overflow-hidden border border-[#F0F0F0] text-left w-full">
						<div class="relative aspect-square overflow-hidden bg-[#F4F4F4]">
							{#if item.image_url}
								<img src={item.image_url} alt={item.title}
									class="w-full h-full object-cover {st==='done'?'opacity-50':''}" loading="lazy" />
							{:else}
								<div class="w-full h-full bg-gradient-to-br {bgPalette[i % bgPalette.length]} flex items-center justify-center text-[36px]">
									{domInfo?.emoji ?? '📦'}
								</div>
							{/if}
							{#if st !== 'sale'}
								<div class="absolute inset-0 {statusMeta[st].overlay} flex items-center justify-center">
									<span class="px-3 py-1 bg-white/90 text-[#1A1A1A] text-[12px] font-bold rounded-full shadow-sm">
										{statusMeta[st].label}
									</span>
								</div>
							{/if}
							{#if domInfo}
								<div class="absolute top-2 left-2 px-1.5 py-0.5 bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold rounded">
									{domInfo.emoji} {domInfo.label}
								</div>
							{/if}
						</div>
						<div class="px-3 pt-2.5 pb-3">
							<p class="text-[13px] font-medium text-[#1A1A1A] line-clamp-2 leading-snug mb-1.5">{item.title}</p>
							<p class="text-[16px] font-bold text-[#1A1A1A] mb-1">{item.price.toLocaleString('ko-KR')}원</p>
							<p class="text-[11px] text-[#AAAAAA]">{classLabel(item.class_num)} · {item.group_num}조</p>
						</div>
					</button>
				{/each}
			</div>

			<!-- ════ 페이지네이션 ════ -->
			{#if totalPages > 1}
				<div class="flex items-center justify-center gap-1.5 mt-10">
					<!-- 이전 -->
					<button
						onclick={() => setPage(data.page - 1)}
						disabled={data.page === 1}
						class="w-9 h-9 flex items-center justify-center rounded-lg border border-[#EBEBEB] text-[#888]
							hover:border-[#00C4C4] hover:text-[#00C4C4] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
						</svg>
					</button>

					{#each pageNumbers(data.page, totalPages) as p}
						{#if p === '…'}
							<span class="w-9 h-9 flex items-center justify-center text-[#BBBBBB] text-[13px]">…</span>
						{:else}
							<button
								onclick={() => setPage(p as number)}
								class="w-9 h-9 flex items-center justify-center rounded-lg border text-[13px] font-semibold transition-colors
									{data.page === p
										? 'bg-[#00C4C4] border-[#00C4C4] text-white shadow-sm'
										: 'border-[#EBEBEB] text-[#555] hover:border-[#00C4C4] hover:text-[#00C4C4]'}"
							>{p}</button>
						{/if}
					{/each}

					<!-- 다음 -->
					<button
						onclick={() => setPage(data.page + 1)}
						disabled={data.page === totalPages}
						class="w-9 h-9 flex items-center justify-center rounded-lg border border-[#EBEBEB] text-[#888]
							hover:border-[#00C4C4] hover:text-[#00C4C4] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
						</svg>
					</button>
				</div>

				<!-- 페이지 정보 -->
				<p class="text-center text-[12px] text-[#AAAAAA] mt-3">
					{(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.total)} / {data.total.toLocaleString()}개
				</p>
			{/if}

		{:else}
			<div class="py-24 text-center">
				<p class="text-[40px] mb-3">🔍</p>
				<p class="text-[16px] font-bold text-[#1A1A1A] mb-1">검색 결과가 없어요</p>
				<p class="text-[13px] text-[#999] mb-5">다른 키워드나 필터를 시도해보세요.</p>
				<button onclick={resetFilters} class="px-5 py-2 bg-[#00C4C4] text-white text-[13px] font-semibold rounded-full hover:bg-[#00AFAF] transition-colors">
					필터 초기화
				</button>
			</div>
		{/if}
	</main>
</div>

<!-- ════════ 상품 상세 모달 ════════ -->
{#if modal}
	{@const st = itemStatus(modal)}
	{@const domInfo = DOMAIN_LABELS[modal.domain]}

	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onclick={() => modal = null}></div>

	<div class="fixed inset-x-4 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
		z-50 bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:w-[480px] max-h-[90vh] overflow-y-auto">

		<button onclick={() => modal = null}
			class="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-[#F0F0F0] flex items-center justify-center hover:bg-[#E0E0E0]">
			<svg class="w-4 h-4 text-[#555]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>
			</svg>
		</button>

		<div class="aspect-square bg-[#F4F4F4] relative overflow-hidden rounded-t-3xl sm:rounded-t-2xl">
			{#if modal.image_url}
				<img src={modal.image_url} alt={modal.title} class="w-full h-full object-contain {st==='done'?'opacity-60':''}" />
			{:else}
				<div class="w-full h-full flex items-center justify-center text-[80px]">{domInfo?.emoji ?? '📦'}</div>
			{/if}
			{#if st !== 'sale'}
				<div class="absolute bottom-4 left-4">
					<span class="px-3 py-1.5 {st==='done'?'bg-black':'bg-[#FF8C00]'} text-white text-[13px] font-bold rounded-full shadow">
						{statusMeta[st].label}
					</span>
				</div>
			{/if}
		</div>

		<div class="p-5">
			<div class="flex items-center gap-2 mb-3 flex-wrap">
				{#if domInfo}
					<span class="px-2.5 py-1 bg-[#E6FAFA] text-[#007A7A] text-[11px] font-bold rounded-full">
						{domInfo.emoji} {domInfo.label} · {domInfo.desc}
					</span>
				{/if}
				<span class="px-2.5 py-1 bg-[#F4F4F4] text-[#555] text-[11px] font-bold rounded-full">
					{classLabel(modal.class_num)} {modal.group_num}조
				</span>
				{#if modal.uploader_student_id}
					<span class="px-2.5 py-1 bg-[#F4F4F4] text-[#555] text-[11px] rounded-full">
						학번 {modal.uploader_student_id}
					</span>
				{/if}
				{#if modal.teacher_name}
					<span class="px-2.5 py-1 bg-[#FFF0E6] text-[#CC5500] text-[11px] font-bold rounded-full">
						👩‍🏫 {modal.teacher_name}
					</span>
				{/if}
			</div>

			<h2 class="text-[18px] font-bold text-[#1A1A1A] leading-snug mb-1">{modal.title}</h2>
			<p class="text-[26px] font-black text-[#00C4C4] mb-4">{modal.price.toLocaleString('ko-KR')}원</p>

			{#if modal.description}
				<p class="text-[14px] text-[#444] leading-relaxed whitespace-pre-wrap mb-5 p-3 bg-[#FAFAFA] rounded-xl border border-[#F0F0F0]">
					{modal.description}
				</p>
			{/if}

			{#if modal.is_reserved && modal.reserved_by}
				<div class="mb-4 p-3 bg-[#FFF7ED] border border-[#FFE4B5] rounded-xl text-[13px] text-[#CC5500]">
					⏳ <strong>{modal.reserved_by}</strong> 님이 예약 중
				</div>
			{/if}

			<div class="space-y-2">
				{#if canReserve}
					<form method="POST" action="?/reserve" use:enhance={() => () => invalidateAll()}>
						<input type="hidden" name="itemId" value={modal.id} />
						<button type="submit" class="w-full py-3.5 bg-[#00C4C4] text-white font-bold text-[15px] rounded-xl hover:bg-[#00AFAF] transition-colors">
							예약하기
						</button>
					</form>
				{/if}
				{#if canComplete}
					<form method="POST" action="?/complete" use:enhance={() => () => invalidateAll()}>
						<input type="hidden" name="itemId" value={modal.id} />
						<button type="submit" class="w-full py-3.5 bg-[#1A1A1A] text-white font-bold text-[15px] rounded-xl hover:bg-[#333] transition-colors">
							거래 완료
						</button>
					</form>
				{/if}
				{#if canCancel}
					<form method="POST" action="?/cancelReserve" use:enhance={() => () => invalidateAll()}>
						<input type="hidden" name="itemId" value={modal.id} />
						<button type="submit" class="w-full py-3.5 bg-white border border-[#DCDCDC] text-[#555] font-semibold text-[14px] rounded-xl hover:bg-[#F5F5F5] transition-colors">
							예약 취소
						</button>
					</form>
				{/if}
				{#if !auth.isLoggedIn}
					<a href="/auth/login" class="block w-full py-3.5 bg-[#00C4C4] text-white font-bold text-[15px] rounded-xl text-center hover:bg-[#00AFAF] transition-colors">
						로그인하고 예약하기
					</a>
				{/if}
				{#if auth.isLoggedIn && !isCnsa && !isSeller}
					<p class="text-center text-[12px] text-[#AAAAAA] py-2">충남삼성고(@cnsa.hs.kr) 계정만 거래 가능합니다</p>
				{/if}
				{#if isSeller && !modal.is_reserved && !modal.is_completed}
					<p class="text-center text-[12px] text-[#00C4C4] font-semibold py-2">✅ 내가 등록한 상품입니다</p>
				{/if}
			</div>

			<p class="text-[11px] text-[#CCCCCC] text-right mt-4">
				{new Date(modal.created_at).toLocaleString('ko-KR', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })} 등록
			</p>
		</div>
	</div>
{/if}
