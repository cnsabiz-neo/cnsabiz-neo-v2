<script lang="ts">
	import { formatShortKRW, formatNumber } from '$lib/utils/currency';
	import { getFundingRate } from '$lib/utils/date';
	import ProgressBar from '$lib/components/campaign/ProgressBar.svelte';

	let { data } = $props();

	const statusLabels: Record<string, { label: string; class: string }> = {
		draft: { label: '임시저장', class: 'bg-gray-100 text-gray-600' },
		pending_review: { label: '검토중', class: 'bg-amber-100 text-amber-700' },
		active: { label: '진행중', class: 'bg-green-100 text-green-700' },
		funded: { label: '펀딩성공', class: 'bg-blue-100 text-blue-700' },
		failed: { label: '미달성', class: 'bg-red-100 text-red-600' },
		cancelled: { label: '취소됨', class: 'bg-gray-100 text-gray-500' }
	};
</script>

<svelte:head><title>대시보드 — 큰사비즈</title></svelte:head>

<div class="max-w-5xl mx-auto px-4 py-8">
	<div class="flex items-center justify-between mb-6">
		<h1 class="text-2xl font-bold text-gray-900">창작자 대시보드</h1>
		<a href="/create" class="px-4 py-2 bg-[#00C4C4] text-white font-semibold text-sm rounded-full hover:bg-[#00AFAF] transition-colors">
			+ 새 프로젝트
		</a>
	</div>

	{#if data.projects.length === 0}
		<div class="text-center py-20 bg-gray-50 rounded-2xl">
			<p class="text-gray-400 mb-4">아직 등록한 프로젝트가 없습니다.</p>
			<a href="/create" class="inline-block px-6 py-2.5 bg-[#00C4C4] text-white font-semibold rounded-full hover:bg-[#00AFAF] transition-colors">
				첫 프로젝트 시작하기
			</a>
		</div>
	{:else}
		<div class="space-y-4">
			{#each data.projects as project}
				{@const rate = getFundingRate(project.current_amount, project.goal_amount)}
				{@const status = statusLabels[project.status]}
				<div class="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-sm transition-shadow">
					<div class="flex items-start gap-4">
						{#if project.thumbnail_url}
							<img src={project.thumbnail_url} alt="" class="w-16 h-16 rounded-xl object-cover shrink-0" />
						{:else}
							<div class="w-16 h-16 rounded-xl bg-[#E6FAFA] shrink-0 flex items-center justify-center">
								<svg class="w-8 h-8 text-[#00C4C4] opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
								</svg>
							</div>
						{/if}

						<div class="flex-1 min-w-0">
							<div class="flex items-start justify-between gap-2">
								<div>
									<span class="inline-block px-2 py-0.5 text-xs font-semibold rounded-full {status.class} mb-1">{status.label}</span>
									<h3 class="text-sm font-bold text-gray-900 leading-snug">{project.title}</h3>
								</div>
								<!-- 비공개(심사중/임시저장)는 preload 비활성화 — preload 요청은 세션 없이 올 수 있음 -->
								<a href="/projects/{project.slug}"
									data-sveltekit-preload-data={['active','funded','failed'].includes(project.status) ? 'hover' : 'off'}
									class="text-xs text-[#00C4C4] hover:underline shrink-0">보기</a>
							</div>

							<div class="mt-3">
								<ProgressBar {rate} />
								<div class="mt-2 flex items-center justify-between text-xs text-gray-500">
									<span><strong class="text-[#00C4C4] text-sm">{rate}%</strong> 달성 · {formatShortKRW(project.current_amount)}</span>
									<span>{formatNumber(project.backer_count)}명 후원</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
