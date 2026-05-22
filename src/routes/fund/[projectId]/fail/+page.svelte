<script lang="ts">
	import { page } from '$app/stores';
	const message = $derived($page.url.searchParams.get('message') ?? '결제가 취소됐습니다.');
</script>

<svelte:head><title>결제 실패 — 큰사비즈</title></svelte:head>

<div class="min-h-[60vh] flex items-center justify-center px-4">
	<div class="text-center max-w-sm">
		<div class="w-20 h-20 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
			<svg class="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
			</svg>
		</div>
		<h1 class="text-2xl font-bold text-gray-900 mb-2">결제가 완료되지 않았습니다</h1>
		<p class="text-gray-500 mb-8">{message}</p>
		<div class="flex flex-col gap-2">
			<button onclick={() => history.back()} class="px-6 py-2.5 bg-[#00C4C4] text-white font-semibold rounded-full hover:bg-[#00AFAF] transition-colors">
				다시 시도
			</button>
			<a href="/" class="px-6 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-full hover:border-gray-300 transition-colors">
				홈으로
			</a>
		</div>
	</div>
</div>
