<script lang="ts">
	import { toast } from '$lib/stores/toast.svelte';

	type Member = { role: string; name: string };
	type Generation = { gen: string; period?: string; members: Member[] };

	/** 세대별 개발진 — 새 기수는 여기에 추가만 하면 됨 */
	const generations: Generation[] = [
		{
			gen: '1대',
			period: '2026',
			members: [
				{ role: '개발', name: '차유근' },
				{ role: '보안', name: '김윤서' },
			],
		},
	];

	function support() {
		toast.success('개발자에게 마음을 전했어요! 💚 응원 감사합니다.');
	}
</script>

<svelte:head>
	<title>개발자 소개 — 큰사비즈</title>
	<meta name="description" content="큰사비즈를 만든 개발진을 소개합니다." />
</svelte:head>

<div class="max-w-3xl mx-auto px-4 py-12">

	<!-- 헤더 -->
	<div class="text-center mb-10">
		<h1 class="text-[26px] font-black text-[#1A1A1A] mb-2">개발자 소개</h1>
		<p class="text-[14px] text-[#888]">큰사비즈를 만들어가는 사람들</p>
	</div>

	<!-- 세대별 카드 (긴 가로 직사각형) -->
	<div class="space-y-4">
		{#each generations as g}
			<div class="flex items-center gap-6 bg-white border border-[#EBEBEB] rounded-2xl px-6 py-6 hover:border-[#00C4C4] transition-colors">

				<!-- 기수 배지 -->
				<div class="shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00C4C4] to-[#00AFAF] flex flex-col items-center justify-center text-white">
					<span class="text-[22px] font-black leading-none">{g.gen}</span>
					{#if g.period}
						<span class="text-[11px] font-medium opacity-80 mt-1">{g.period}</span>
					{/if}
				</div>

				<!-- 구분선 -->
				<div class="self-stretch w-px bg-[#F0F0F0]"></div>

				<!-- 멤버 -->
				<div class="flex flex-wrap items-center gap-x-12 gap-y-4">
					{#each g.members as m}
						<div>
							<p class="text-[12px] font-semibold text-[#AAAAAA] mb-0.5">{m.role}</p>
							<p class="text-[18px] font-bold text-[#1A1A1A]">{m.name}</p>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<!-- 개발자 후원하기 -->
	<div class="mt-10 text-center">
		<button
			onclick={support}
			class="inline-flex items-center gap-2 px-8 py-3.5 bg-[#00C4C4] text-white font-bold text-[15px] rounded-xl hover:bg-[#00AFAF] transition-colors shadow-sm"
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
			</svg>
			개발자 후원하기
		</button>
		<p class="mt-3 text-[12px] text-[#BBBBBB]">큰사비즈 개발진에게 응원을 보내주세요.</p>
	</div>
</div>
