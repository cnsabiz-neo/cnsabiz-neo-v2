<script lang="ts">
	import { formatKRW } from '$lib/utils/currency';
	import { fundingCart } from '$lib/stores/funding-cart.svelte';
	import { onMount } from 'svelte';
	import { toast } from '$lib/stores/toast.svelte';

	let { data } = $props();

	onMount(() => fundingCart.clear());

	let copied = $state(false);

	/** 계좌번호 클립보드 복사 */
	async function copyAccount() {
		try {
			await navigator.clipboard.writeText(data.bankAccount.account);
			copied = true;
			toast.success('계좌번호가 복사됐습니다!');
			setTimeout(() => (copied = false), 2000);
		} catch {
			toast.error('복사에 실패했습니다. 직접 입력해주세요.');
		}
	}

	/** 마감 날짜 포맷 */
	const deadlineStr = $derived(() => {
		if (!data.bankAccount.deadline) return null;
		const d = new Date(data.bankAccount.deadline);
		return `${d.getMonth() + 1}월 ${d.getDate()}일 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}까지`;
	});
</script>

<svelte:head><title>후원 신청 완료 — 큰사비즈</title></svelte:head>

<div class="max-w-lg mx-auto px-4 py-12">

	<!-- 상단 완료 표시 -->
	<div class="text-center mb-8">
		<div class="w-16 h-16 mx-auto mb-4 bg-[#E6FAFA] rounded-full flex items-center justify-center">
			<svg class="w-8 h-8 text-[#00C4C4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
			</svg>
		</div>
		<h1 class="text-[22px] font-bold text-[#1A1A1A] mb-1">후원 신청이 완료됐습니다!</h1>
		<p class="text-[14px] text-[#888]">아래 계좌로 이체하시면 후원이 확정됩니다.</p>
	</div>

	<!-- 계좌 안내 카드 -->
	<div class="bg-white border-2 border-[#00C4C4] rounded-2xl overflow-hidden mb-5">
		<div class="bg-[#00C4C4] px-5 py-3 flex items-center gap-2">
			<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
			</svg>
			<span class="text-white font-semibold text-[14px]">입금 계좌 안내</span>
		</div>

		<div class="p-5 space-y-3">
			<!-- 은행 -->
			<div class="flex items-center justify-between">
				<span class="text-[13px] text-[#888]">은행</span>
				<span class="text-[14px] font-semibold text-[#1A1A1A]">{data.bankAccount.bank}</span>
			</div>

			<!-- 계좌번호 + 복사 -->
			<div class="flex items-center justify-between">
				<span class="text-[13px] text-[#888]">계좌번호</span>
				<div class="flex items-center gap-2">
					<span class="text-[16px] font-bold text-[#1A1A1A] tracking-wide">
						{data.bankAccount.account}
					</span>
					<button
						onclick={copyAccount}
						class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors
							{copied ? 'bg-[#00C4C4] text-white' : 'bg-[#F0FDFD] text-[#00C4C4] border border-[#CCEEEE] hover:bg-[#E0FAFA]'}"
					>
						{#if copied}
							<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
							</svg>
							복사됨
						{:else}
							<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
							</svg>
							복사
						{/if}
					</button>
				</div>
			</div>

			<!-- 예금주 -->
			<div class="flex items-center justify-between">
				<span class="text-[13px] text-[#888]">예금주</span>
				<span class="text-[14px] font-semibold text-[#1A1A1A]">{data.bankAccount.holder}</span>
			</div>

			<!-- 구분선 -->
			<div class="border-t border-dashed border-[#CCEEEE] my-1"></div>

			<!-- 입금 금액 -->
			<div class="flex items-center justify-between">
				<span class="text-[13px] text-[#888]">입금 금액</span>
				<span class="text-[20px] font-bold text-[#00C4C4]">{formatKRW(data.amount)}</span>
			</div>

			<!-- 입금자명 -->
			{#if data.depositorName}
				<div class="flex items-center justify-between">
					<span class="text-[13px] text-[#888]">입금자명 (필수)</span>
					<span class="text-[14px] font-bold text-[#E05000]">{data.depositorName}</span>
				</div>
			{/if}
		</div>
	</div>

	<!-- 안내 박스 -->
	<div class="bg-[#FFFBF0] border border-[#FFE8B0] rounded-xl p-4 mb-6 space-y-2">
		<p class="text-[12px] font-semibold text-[#886600] flex items-center gap-1.5">
			<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
			</svg>
			꼭 확인해주세요
		</p>
		<ul class="text-[12px] text-[#886600] space-y-1 pl-5 list-disc">
			<li>입금자명을 <strong>{data.depositorName ?? '신청 시 입력한 이름'}</strong>으로 정확히 입력해주세요.</li>
			<li>다른 이름으로 입금하면 자동 확인이 되지 않을 수 있습니다.</li>
			{#if deadlineStr()}
				<li>이체 마감: <strong>{deadlineStr()}</strong></li>
			{/if}
			<li>이체 확인 후 1~2 영업일 내에 후원이 최종 완료됩니다.</li>
		</ul>
	</div>

	<!-- 하단 버튼 -->
	<div class="flex flex-col gap-2">
		{#if data.projectSlug}
			<a
				href="/projects/{data.projectSlug}"
				class="block w-full text-center py-3 bg-[#00C4C4] text-white font-semibold rounded-xl hover:bg-[#00AFAF] transition-colors"
			>
				프로젝트 보러가기
			</a>
		{/if}
		<a
			href="/my/fundings"
			class="block w-full text-center py-3 border border-[#EBEBEB] text-[#555] font-semibold rounded-xl hover:border-[#AAAAAA] transition-colors"
		>
			후원 내역 확인하기
		</a>
	</div>

	<p class="mt-5 text-center text-[11px] text-[#BBBBBB]">
		주문번호: {data.orderId}
	</p>
</div>
