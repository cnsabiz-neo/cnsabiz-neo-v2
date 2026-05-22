<script lang="ts">
	import { getAuthContext } from '$lib/stores/auth.svelte';
	import { toast } from '$lib/stores/toast.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import logo from '$lib/assets/logo.png';

	const auth = getAuthContext();
	let email = $state('');
	let password = $state('');
	let displayName = $state('');
	let loading = $state(false);

	const next = $derived($page.url.searchParams.get('next') ?? '/');

	async function handleSignup(e: SubmitEvent) {
		e.preventDefault();
		if (!auth.supabase) return;
		if (password.length < 8) {
			toast.error('비밀번호는 8자 이상이어야 합니다.');
			return;
		}
		loading = true;
		const { error } = await auth.supabase.auth.signUp({
			email,
			password,
			options: { data: { full_name: displayName } }
		});
		loading = false;
		if (error) {
			toast.error(error.message);
		} else {
			toast.success('인증 이메일을 발송했습니다. 이메일을 확인해주세요.');
			goto('/auth/login');
		}
	}
</script>

<svelte:head><title>회원가입 — 큰사비즈</title></svelte:head>

<div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
	<div class="w-full max-w-sm">
		<div class="text-center mb-8">
			<a href="/" class="inline-flex items-center gap-2 justify-center hover:opacity-80 transition-opacity">
				<img src={logo} alt="큰사비즈" class="h-10 w-auto" />
				<span class="text-[22px] font-black text-[#1A1A1A]">큰사비즈</span>
			</a>
			<h1 class="mt-5 text-xl font-bold text-gray-900">회원가입</h1>
		</div>

		<div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
			<form onsubmit={handleSignup} class="space-y-3">
				<div>
					<label for="displayName" class="block text-xs font-medium text-gray-600 mb-1">닉네임</label>
					<input
						id="displayName"
						type="text"
						bind:value={displayName}
						required
						placeholder="닉네임을 입력하세요"
						class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00C4C4] focus:border-transparent"
					/>
				</div>
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
						minlength={8}
						placeholder="8자 이상 입력하세요"
						class="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00C4C4] focus:border-transparent"
					/>
				</div>
				<button
					type="submit"
					disabled={loading}
					class="w-full py-2.5 bg-[#00C4C4] text-white font-semibold rounded-xl hover:bg-[#00AFAF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
				>
					{loading ? '가입 중...' : '회원가입'}
				</button>
			</form>
		</div>

		<p class="mt-4 text-center text-sm text-gray-500">
			이미 계정이 있으신가요?
			<a href="/auth/login?next={next}" class="text-[#00C4C4] font-medium hover:underline">로그인</a>
		</p>
	</div>
</div>
