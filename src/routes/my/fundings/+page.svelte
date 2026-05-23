<script lang="ts">
	import { formatKRW } from '$lib/utils/currency';
	import { formatKoDate } from '$lib/utils/date';

	let { data } = $props();

	const statusLabels: Record<string, { label: string; class: string }> = {
		pending: { label: '결제 대기', class: 'text-amber-600 bg-amber-50' },
		paid: { label: '후원 완료', class: 'text-green-700 bg-green-50' },
		cancelled: { label: '취소됨', class: 'text-gray-500 bg-gray-50' },
		refunded: { label: '환불됨', class: 'text-red-500 bg-red-50' }
	};
</script>

<svelte:head><title>나의 후원 내역 — 큰사비즈</title></svelte:head>

<div class="max-w-3xl mx-auto px-4 py-8">
	<h1 class="text-2xl font-bold text-gray-900 mb-6">나의 후원 내역</h1>

	{#if data.fundings.length === 0}
		<div class="text-center py-20 bg-gray-50 rounded-2xl">
			<p class="text-gray-400 mb-4">아직 후원한 프로젝트가 없습니다.</p>
			<a href="/discover" class="inline-block px-6 py-2.5 bg-[#00C4C4] text-white font-semibold rounded-full hover:bg-[#00AFAF] transition-colors">
				프로젝트 탐색하기
			</a>
		</div>
	{:else}
		<div class="space-y-3">
			{#each data.fundings as funding}
				{@const status = statusLabels[funding.status]}
				{@const project = funding.projects}
				{@const reward = funding.rewards}
				<div class="bg-white border border-gray-100 rounded-2xl p-4">
					<div class="flex items-start gap-3">
						{#if project?.thumbnail_url}
							<img src={project.thumbnail_url} alt="" class="w-12 h-12 rounded-xl object-cover shrink-0" />
						{/if}
						<div class="flex-1 min-w-0">
							<div class="flex items-start justify-between gap-2">
								<div>
									<a href="/projects/{project?.slug}" class="text-sm font-semibold text-gray-900 hover:text-[#00C4C4] line-clamp-1">
										{project?.title ?? '삭제된 프로젝트'}
									</a>
									{#if reward}
										<p class="text-xs text-gray-500 mt-0.5">{reward.title}</p>
									{/if}
								</div>
								<span class="shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full {status.class}">{status.label}</span>
							</div>
							<div class="mt-2 flex items-center justify-between text-xs text-gray-400">
								<span>{formatKoDate(funding.created_at)}</span>
								<span class="font-semibold text-gray-700">{formatKRW(funding.amount)}</span>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
