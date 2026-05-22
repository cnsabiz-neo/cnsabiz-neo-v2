<script lang="ts">
	import { fundingCart } from '$lib/stores/funding-cart.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { formatKRW } from '$lib/utils/currency';
	import RewardSelector from '$lib/components/funding/RewardSelector.svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();
	let loading = $state(false);
	let depositorName = $state('');	// 입금자명

	/** 계좌이체 후원 신청 */
	async function submitFunding() {
		if (!fundingCart.item) return;
		if (!depositorName.trim()) {
			toast.error('입금자명을 입력해주세요.');
			return;
		}
		loading = true;

		try {
			const res = await fetch(`/fund/${data.project.id}/init`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					rewardId: fundingCart.item.reward.id,
					quantity: fundingCart.item.quantity,
					depositorName: depositorName.trim()
				})
			});

			if (!res.ok) {
				const errData = await res.json().catch(() => ({ message: '신청에 실패했습니다.' })) as { message?: string };
				toast.error(errData.message ?? '신청에 실패했습니다.');
				return;
			}

			const { orderId } = await res.json() as { orderId: string };
			goto(`/fund/${data.project.id}/success?orderId=${orderId}`);
		} catch {
			toast.error('오류가 발생했습니다. 다시 시도해주세요.');
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head><title>{data.project.title} 후원 — 큰사비즈</title></svelte:head>

<div class="max-w-2xl mx-auto px-4 py-10">

	<!-- 프로젝트 정보 -->
	<div class="flex items-center gap-3 mb-7">
		{#if data.project.thumbnail_url}
			<img src={data.project.thumbnail_url} alt="" class="w-14 h-14 rounded-xl object-cover shrink-0" />
		{/if}
		<div>
			<p class="text-[11px] text-[#999] mb-0.5">후원할 프로젝트</p>
			<h1 class="text-[15px] font-bold text-[#1A1A1A] leading-snug">{data.project.title}</h1>
		</div>
	</div>

	<!-- STEP 1: 리워드 선택 -->
	<div class="mb-5">
		<h2 class="text-[13px] font-semibold text-[#999] uppercase tracking-wide mb-3">
			Step 1 · 리워드 선택
		</h2>
		<div class="bg-white border border-[#EBEBEB] rounded-xl p-5">
			<RewardSelector rewards={data.rewards} projectId={data.project.id} />
		</div>
	</div>

	{#if fundingCart.item}
		<!-- STEP 2: 입금자명 입력 -->
		<div class="mb-5">
			<h2 class="text-[13px] font-semibold text-[#999] uppercase tracking-wide mb-3">
				Step 2 · 입금자명 입력
			</h2>
			<div class="bg-white border border-[#EBEBEB] rounded-xl p-5">
				<label for="depositorName" class="block text-[13px] font-medium text-[#555] mb-2">
					계좌 이체 시 사용할 입금자명
				</label>
				<input
					id="depositorName"
					type="text"
					bind:value={depositorName}
					placeholder="홍길동"
					maxlength={20}
					class="w-full px-4 py-2.5 border border-[#DDDDDD] rounded-lg text-[14px] text-[#1A1A1A] placeholder-[#BBBBBB] focus:border-[#00C4C4] focus:ring-0 outline-none transition-colors"
				/>
				<p class="mt-2 text-[11px] text-[#AAAAAA]">
					실제 이체할 때 사용하는 입금자명과 동일하게 입력해주세요.
				</p>
			</div>
		</div>

		<!-- STEP 3: 최종 확인 -->
		<div class="mb-6">
			<h2 class="text-[13px] font-semibold text-[#999] uppercase tracking-wide mb-3">
				Step 3 · 후원 내용 확인
			</h2>
			<div class="bg-[#F0FDFD] border border-[#CCEEEE] rounded-xl p-5 space-y-2.5">
				<div class="flex items-center justify-between text-[13px]">
					<span class="text-[#555]">선택 리워드</span>
					<span class="font-semibold text-[#1A1A1A]">{fundingCart.item.reward.title}</span>
				</div>
				<div class="flex items-center justify-between text-[13px]">
					<span class="text-[#555]">수량</span>
					<span class="font-semibold text-[#1A1A1A]">{fundingCart.item.quantity}개</span>
				</div>
				{#if depositorName}
					<div class="flex items-center justify-between text-[13px]">
						<span class="text-[#555]">입금자명</span>
						<span class="font-semibold text-[#1A1A1A]">{depositorName}</span>
					</div>
				{/if}
				<div class="border-t border-[#B2E8E8] pt-2.5 flex items-center justify-between">
					<span class="text-[14px] font-semibold text-[#1A1A1A]">총 후원 금액</span>
					<span class="text-[20px] font-bold text-[#00C4C4]">{formatKRW(fundingCart.total)}</span>
				</div>
			</div>
		</div>

		<button
			onclick={submitFunding}
			disabled={loading || !depositorName.trim()}
			class="w-full py-4 bg-[#00C4C4] text-white font-bold text-[15px] rounded-xl hover:bg-[#00AFAF] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
		>
			{loading ? '신청 중...' : '계좌이체로 후원 신청하기'}
		</button>

		<p class="mt-3 text-center text-[12px] text-[#AAAAAA]">
			신청 후 안내된 계좌로 이체하면 후원이 완료됩니다.
		</p>
	{/if}
</div>
