<svelte:head><title>오프라인 — 큰사비즈</title></svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
	<div class="text-center">
		<div class="w-20 h-20 mx-auto mb-6 bg-[#E6FAFA] rounded-full flex items-center justify-center">
			<svg class="w-10 h-10 text-[#00C4C4] opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 11a1 1 0 100 2 1 1 0 000-2zM3.636 5.636a9 9 0 0012.728 0M6.464 8.464a5 5 0 017.072 0"/>
			</svg>
		</div>
		<h1 class="text-2xl font-bold text-gray-900 mb-2">인터넷 연결이 없어요</h1>
		<p class="text-gray-500 mb-6">네트워크 연결을 확인한 후 다시 시도해주세요.</p>
		<button
			onclick={() => location.reload()}
			class="px-6 py-2.5 bg-[#00C4C4] text-white font-semibold rounded-full hover:bg-[#00AFAF] transition-colors"
		>
			다시 시도
		</button>
	</div>
</div>
