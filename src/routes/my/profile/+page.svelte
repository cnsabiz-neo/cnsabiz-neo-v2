<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from '$lib/stores/toast.svelte';

	let { data, form } = $props();

	let displayName = $state(data.profile.display_name ?? '');
	let bio         = $state(data.profile.bio ?? '');
	let avatarUrl   = $state(data.profile.avatar_url ?? '');
	let saving      = $state(false);

	$effect(() => {
		if (form?.success) toast.success('프로필이 저장됐습니다.');
		else if (form?.error) toast.error(form.error as string);
	});

	const initial = $derived((displayName || data.email || 'U')[0].toUpperCase());
</script>

<svelte:head><title>내 프로필 — 큰사비즈</title></svelte:head>

<div class="max-w-xl mx-auto px-4 py-10">
	<h1 class="text-[22px] font-bold text-[#1A1A1A] mb-6">내 프로필</h1>

	<form
		method="POST"
		action="?/save"
		use:enhance={() => {
			saving = true;
			return async ({ update }) => { saving = false; await update(); };
		}}
		class="bg-white border border-[#EBEBEB] rounded-2xl p-6 space-y-5"
	>
		<!-- 아바타 미리보기 -->
		<div class="flex items-center gap-4">
			<div class="w-16 h-16 rounded-full overflow-hidden bg-[#00C4C4] flex items-center justify-center text-white text-[24px] font-bold shrink-0">
				{#if avatarUrl}
					<img src={avatarUrl} alt="프로필" class="w-full h-full object-cover" />
				{:else}
					{initial}
				{/if}
			</div>
			<div class="flex-1">
				<label for="avatar_url" class="block text-[12px] font-medium text-[#888] mb-1">프로필 이미지 URL</label>
				<input
					id="avatar_url"
					name="avatar_url"
					type="url"
					bind:value={avatarUrl}
					placeholder="https://..."
					class="w-full px-3 py-2 border border-[#DDDDDD] rounded-lg text-[14px] focus:border-[#00C4C4] outline-none transition-colors"
				/>
			</div>
		</div>

		<!-- 이메일 (읽기 전용) -->
		<div>
			<span class="block text-[12px] font-medium text-[#888] mb-1">이메일</span>
			<p class="px-3 py-2 bg-[#F8F8F8] border border-[#EEEEEE] rounded-lg text-[14px] text-[#888]">{data.email}</p>
		</div>

		<!-- 닉네임 -->
		<div>
			<label for="display_name" class="block text-[12px] font-medium text-[#888] mb-1">닉네임 <span class="text-[#FF5C35]">*</span></label>
			<input
				id="display_name"
				name="display_name"
				type="text"
				bind:value={displayName}
				maxlength={20}
				required
				placeholder="표시될 이름"
				class="w-full px-3 py-2 border border-[#DDDDDD] rounded-lg text-[14px] focus:border-[#00C4C4] outline-none transition-colors"
			/>
		</div>

		<!-- 소개 -->
		<div>
			<label for="bio" class="block text-[12px] font-medium text-[#888] mb-1">소개</label>
			<textarea
				id="bio"
				name="bio"
				bind:value={bio}
				maxlength={200}
				rows={3}
				placeholder="자기소개를 입력하세요 (선택)"
				class="w-full px-3 py-2 border border-[#DDDDDD] rounded-lg text-[14px] focus:border-[#00C4C4] outline-none transition-colors resize-none"
			></textarea>
			<p class="mt-1 text-right text-[11px] text-[#BBBBBB]">{bio.length}/200</p>
		</div>

		<button
			type="submit"
			disabled={saving}
			class="w-full py-3 bg-[#00C4C4] text-white font-bold text-[15px] rounded-xl hover:bg-[#00AFAF] transition-colors disabled:opacity-50"
		>
			{saving ? '저장 중...' : '저장하기'}
		</button>
	</form>

	<!-- 바로가기 -->
	<div class="mt-4 flex flex-wrap gap-2">
		<a href="/my/fundings" class="flex-1 text-center py-2.5 border border-[#EBEBEB] rounded-xl text-[13px] font-medium text-[#555] hover:border-[#AAAAAA] transition-colors">내 후원 내역</a>
		<a href="/my/likes" class="flex-1 text-center py-2.5 border border-[#EBEBEB] rounded-xl text-[13px] font-medium text-[#555] hover:border-[#AAAAAA] transition-colors">찜 목록</a>
		<a href="/dashboard" class="flex-1 text-center py-2.5 border border-[#EBEBEB] rounded-xl text-[13px] font-medium text-[#555] hover:border-[#AAAAAA] transition-colors">메이커홈</a>
	</div>
</div>
