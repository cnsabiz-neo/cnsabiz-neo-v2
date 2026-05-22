<script lang="ts">
	import { fundingCart } from '$lib/stores/funding-cart.svelte';
	import { formatKRW, formatNumber } from '$lib/utils/currency';
	import { formatKoMonthDay } from '$lib/utils/date';
	import type { Database } from '$lib/supabase/types';

	type Reward = Database['public']['Tables']['rewards']['Row'];

	let { rewards, projectId }: { rewards: Reward[]; projectId: string } = $props();

	const selectedId = $derived(fundingCart.item?.reward.id ?? null);

	function select(reward: Reward) {
		if (isSoldOut(reward)) return;
		fundingCart.select(reward);
	}

	function isSoldOut(reward: Reward) {
		return reward.max_quantity !== null && reward.claimed_count >= reward.max_quantity;
	}
</script>

<div class="space-y-3">
	<h3 class="text-base font-bold text-gray-900">리워드 선택</h3>

	{#each rewards as reward}
		{@const soldOut = isSoldOut(reward)}
		{@const selected = selectedId === reward.id}
		<button
			onclick={() => select(reward)}
			disabled={soldOut}
			class="w-full text-left p-4 rounded-xl border-2 transition-all
				{soldOut ? 'border-gray-100 opacity-50 cursor-not-allowed' :
				 selected ? 'border-[#00C4C4] bg-[#E6FAFA]' :
				 'border-gray-200 hover:border-gray-300'}"
		>
			<div class="flex items-start justify-between gap-2">
				<div class="flex-1 min-w-0">
					<div class="flex items-center gap-2 mb-1">
						{#if reward.is_early_bird}
							<span class="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded">얼리버드</span>
						{/if}
						{#if soldOut}
							<span class="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs font-semibold rounded">품절</span>
						{/if}
					</div>
					<p class="text-sm font-semibold text-gray-900">{reward.title}</p>
					{#if reward.description}
						<p class="mt-1 text-xs text-gray-500 leading-relaxed">{reward.description}</p>
					{/if}
					<div class="mt-2 flex items-center gap-3 text-xs text-gray-400">
						{#if reward.estimated_delivery}
							<span>배송 예정: {formatKoMonthDay(reward.estimated_delivery)}</span>
						{/if}
						{#if reward.max_quantity !== null}
							<span>{formatNumber(reward.claimed_count)}/{formatNumber(reward.max_quantity)} 선택됨</span>
						{/if}
					</div>
					{#if reward.max_quantity !== null && !soldOut}
						<div class="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
							<div
								class="h-full bg-[#00C4C4] rounded-full"
								style="width: {Math.min((reward.claimed_count / reward.max_quantity) * 100, 100)}%"
							></div>
						</div>
					{/if}
				</div>
				<div class="shrink-0 text-right">
					<span class="text-base font-bold text-[#00C4C4]">{formatKRW(reward.amount)}</span>
				</div>
			</div>
		</button>
	{/each}

	{#if fundingCart.item}
		<div class="sticky bottom-4 mt-4">
			<a
				href="/fund/{projectId}"
				class="block w-full text-center py-3 bg-[#00C4C4] text-white font-bold rounded-xl hover:bg-[#00AFAF] transition-colors shadow-lg"
			>
				{formatKRW(fundingCart.total)} 후원하기
			</a>
		</div>
	{/if}
</div>
