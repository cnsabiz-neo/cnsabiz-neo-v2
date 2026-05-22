<script lang="ts">
	import { getCountdownLabel } from '$lib/utils/date';

	let { endsAt }: { endsAt: string } = $props();
	let label = $state(getCountdownLabel(endsAt));

	$effect(() => {
		const target = endsAt;
		label = getCountdownLabel(target);
		const timer = setInterval(() => {
			label = getCountdownLabel(target);
		}, 1000);
		return () => clearInterval(timer);
	});
</script>

<span class="font-mono text-sm font-semibold {label === '마감' ? 'text-gray-400' : 'text-gray-800'}">
	{label}
</span>
