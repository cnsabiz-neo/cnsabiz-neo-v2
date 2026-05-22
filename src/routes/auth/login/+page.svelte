<script lang="ts">
	import { getAuthContext } from '$lib/stores/auth.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import logo from '$lib/assets/logo.png';

	const auth = getAuthContext();
	let email = $state('');
	let password = $state('');
	let loading = $state(false);

	const next = $derived($page.url.searchParams.get('next') ?? '/');

	async function handleLogin(e: SubmitEvent) {
		e.preventDefault();
		if (!auth.supabase) return;
		loading = true;

		let loginEmail    = email;
		let loginPassword = password;

		// 개발용 단축 로그인: 이메일 "1@gmail.com" + 비밀번호 "1"
		if (email.trim() === '1@gmail.com' && password === '1') {
			try {
				const res = await fetch('/auth/dev-login', { method: 'POST' });
				if (!res.ok) throw new Error('dev-login 실패');
				const creds = await res.json() as { email: string; password: string };
				loginEmail    = creds.email;
				loginPassword = creds.password;
			} catch {
				loading = false;
				toast.error('테스트 계정 준비에 실패했습니다.');
				return;
			}
		}

		const { error } = await auth.supabase.auth.signInWithPassword({
			email: loginEmail, password: loginPassword
		});
		loading = false;
		if (error) {
			toast.error(error.message === 'Invalid login credentials' ? '이메일 또는 비밀번호가 올바르지 않습니다.' : error.message);
		} else {
			goto(next);
		}
	}

	async function handleGoogleLogin() {
		if (!auth.supabase) return;
		await auth.supabase.auth.signInWithOAuth({
			provider: 'google',
			options: { redirectTo: `${location.origin}/auth/callback?next=${next}` }
		});
	}
</script>

<svelte:head><title>로그인 — 큰사비즈</title></svelte:head>

<div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
	<div class="w-full max-w-sm">
		<div class="text-center mb-8">
			<a href="/" class="inline-flex items-center gap-2 justify-center hover:opacity-80 transition-opacity">
				<img src={logo} alt="큰사비즈" class="h-10 w-auto" />
				<span class="text-[22px] font-black text-[#1A1A1A]">큰사비즈</span>
			</a>
			<h1 class="mt-5 text-xl font-bold text-gray-900">로그인</h1>
		</div>

		<div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
			<button
				onclick={handleGoogleLogin}
				class="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-4"
			>
				<svg class="w-5 h-5" viewBox="0 0 24 24">
					<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
					<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
					<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
					<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
				</svg>
				Google로 계속하기
			</button>

			<div class="relative my-4">
				<div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-200"></div></div>
				<div class="relative flex justify-center text-xs text-gray-400 bg-white px-3">또는</div>
			</div>

			<form onsubmit={handleLogin} class="space-y-3">
				<div>
					<label for="email" class="block text-xs font-medium text-gray-600 mb-1">이메일</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						required
						placeholder="이메일을 입력하세요"
						class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00C4C4] focus:border-transparent"
					/>
				</div>
				<div>
					<label for="password" class="block text-xs font-medium text-gray-600 mb-1">비밀번호</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						required
						placeholder="비밀번호를 입력하세요"
						class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00C4C4] focus:border-transparent"
					/>
				</div>
				<button
					type="submit"
					disabled={loading}
					class="w-full py-2.5 bg-[#00C4C4] text-white font-semibold rounded-xl hover:bg-[#00AFAF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
				>
					{loading ? '로그인 중...' : '로그인'}
				</button>
			</form>
		</div>

		<p class="mt-4 text-center text-sm text-gray-500">
			계정이 없으신가요?
			<a href="/auth/signup?next={next}" class="text-[#00C4C4] font-medium hover:underline">회원가입</a>
		</p>
	</div>
</div>
