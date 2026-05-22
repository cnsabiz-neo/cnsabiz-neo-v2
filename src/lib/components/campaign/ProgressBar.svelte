<script lang="ts">
	let { rate, class: className = '' }: { rate: number; class?: string } = $props();
	const capped = $derived(Math.min(rate, 100));
</script>

<div
	class="relative h-[3px] bg-[#EBEBEB] rounded-full overflow-hidden {className}"
	role="progressbar"
	aria-valuenow={rate}
	aria-valuemin={0}
	aria-valuemax={100}
>
	<div
		class="h-full rounded-full animate-progress bg-[#00C4C4]"
		style="width: {capped}%"
	></div>
</div>
