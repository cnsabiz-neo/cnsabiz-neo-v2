<script lang="ts">
	import './layout.css';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import MobileNav from '$lib/components/layout/MobileNav.svelte';
	import ToastContainer from '$lib/components/layout/ToastContainer.svelte';
	import { setAuthContext } from '$lib/stores/auth.svelte';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import logo from '$lib/assets/logo.png';

	let { data, children } = $props();

	const auth = setAuthContext({
		get session() { return data.session; },
		get user() { return data.user; },
		get supabase() { return data.supabase; }
	});

	$effect(() => {
		auth.setSession(data.session, data.user);
	});

	onMount(() => {
		const supabase = data.supabase;
		const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
			if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
				invalidate('supabase:auth');
			}
		});
		return () => subscription.unsubscribe();
	});
</script>

<svelte:head>
	<link rel="icon" href={logo} type="image/png" />
	<!-- Pretendard (UI 전용) -->
	<link rel="stylesheet" as="style" crossorigin="anonymous"
		href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
	<!-- 본고딕 / Noto Sans KR (본문 전용) -->
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet" />
</svelte:head>

<Header />
<!-- 모바일: 하단 내비 높이(56px)만큼 패딩 확보 -->
<main class="min-h-[calc(100vh-3.5rem)] pb-14 md:pb-0">
	{@render children()}
</main>
<Footer />
<MobileNav />
<ToastContainer />
