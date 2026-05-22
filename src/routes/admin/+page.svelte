<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatKRW } from '$lib/utils/currency';
	import { formatKoDate } from '$lib/utils/date';

	let { data, form } = $props();

	// 반려 사유 입력 (프로젝트별 토글)
	let rejectingId  = $state<string | null>(null);
	let rejectReason = $state('');

	// 비밀번호 입력
	let pwInput = $state('');

	function startReject(id: string) { rejectingId = id; rejectReason = ''; }
	function cancelReject()          { rejectingId = null; }

	const statusLabel: Record<string, { text: string; cls: string }> = {
		active:   { text: '공개 중',   cls: 'bg-green-100 text-green-700'    },
		funded:   { text: '펀딩 성공', cls: 'bg-blue-100 text-blue-700'      },
		failed:   { text: '펀딩 실패', cls: 'bg-red-100 text-red-700'        },
		draft:    { text: '반려/작성', cls: 'bg-gray-100 text-gray-600'      },
		cancelled:{ text: '취소됨',    cls: 'bg-gray-100 text-gray-500'      },
	};
</script>

<svelte:head><title>관리자 — 큰사비즈</title></svelte:head>

<!-- ══════════════════════════════════════════════
     비밀번호 게이트
══════════════════════════════════════════════ -->
{#if data.needsAuth}
	<div class="min-h-screen bg-[#F7F7F7] flex items-center justify-center px-4">
		<div class="w-full max-w-sm">
			<div class="text-center mb-8">
				<div class="text-4xl mb-3">🛡️</div>
				<h1 class="text-[20px] font-bold text-[#1A1A1A]">관리자 전용 페이지</h1>
				<p class="text-[13px] text-[#888] mt-1">관리자 비밀번호를 입력하세요</p>
			</div>

			<div class="bg-white rounded-2xl shadow-sm border border-[#EBEBEB] p-6">
				<form method="POST" action="?/unlock" use:enhance class="space-y-4">
					<div>
						<label for="admin-pw" class="block text-xs font-medium text-[#666] mb-1">비밀번호</label>
						<input
							id="admin-pw"
							type="password"
							name="password"
							bind:value={pwInput}
							required
							autocomplete="off"
							placeholder="관리자 비밀번호"
							class="w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00C4C4] focus:border-transparent
								{form?.wrongPassword ? 'border-red-300 bg-red-50' : 'border-gray-200'}"
						/>
						{#if form?.wrongPassword}
							<p class="text-[12px] text-red-500 mt-1">비밀번호가 올바르지 않습니다.</p>
						{/if}
					</div>
					<button type="submit"
						class="w-full py-2.5 bg-[#1A1A1A] text-white font-semibold rounded-xl hover:bg-[#333] transition-colors text-sm">
						입장
					</button>
				</form>
			</div>

			<p class="text-center text-[12px] text-[#AAAAAA] mt-4">
				<a href="/" class="hover:text-[#666] transition-colors">← 홈으로 돌아가기</a>
			</p>
		</div>
	</div>

<!-- ══════════════════════════════════════════════
     관리자 패널
══════════════════════════════════════════════ -->
{:else}
	<div class="min-h-screen bg-[#F7F7F7]">

		<!-- 헤더 -->
		<div class="bg-white border-b border-[#EBEBEB] px-6 py-4 flex items-center justify-between sticky top-0 z-20">
			<div class="flex items-center gap-3">
				<a href="/" class="text-[#888] hover:text-[#333] text-sm transition-colors">← 홈</a>
				<span class="text-[#DEDEDE]">|</span>
				<span class="text-[17px] font-bold text-[#1A1A1A]">🛡️ 관리자 — 프로젝트 심사</span>
			</div>
			{#if data.userEmail}
				<span class="text-[12px] text-[#AAAAAA] hidden sm:block">{data.userEmail}</span>
			{/if}
		</div>

		<div class="max-w-5xl mx-auto px-4 py-8 space-y-8">

			<!-- ── 알림 배너 ── -->
			{#if form?.success}
				<div class="flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] font-medium
					{form.action === 'approve'
						? 'bg-green-50 text-green-700 border border-green-200'
						: 'bg-orange-50 text-orange-700 border border-orange-200'}">
					{form.action === 'approve'
						? '✅ 승인 완료 — 프로젝트가 공개되었습니다.'
						: '↩️ 반려 완료 — 창작자가 수정 후 재제출할 수 있습니다.'}
				</div>
			{/if}
			{#if form?.registered}
				<div class="flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
					🎉 관리자 등록 완료! 이제 구글 로그인만으로 이 페이지에 접근할 수 있습니다.
				</div>
			{/if}
			{#if form?.message}
				<div class="px-4 py-3 rounded-xl text-[13px] bg-red-50 text-red-700 border border-red-200">
					⚠️ {form.message}
				</div>
			{/if}

			<!-- ── 관리자 등록 (비밀번호로 입장했지만 아직 is_admin 아닌 경우) ── -->
			{#if data.passwordUnlocked && !data.isAdmin}
				<div class="bg-[#FFFBF0] border border-[#FFE8B0] rounded-2xl p-5">
					<h2 class="text-[14px] font-bold text-[#886600] mb-1">👋 최초 관리자 설정</h2>
					<p class="text-[13px] text-[#886600] mb-4">
						비밀번호로 입장했습니다. 구글 계정(@cnsa.hs.kr)으로 로그인한 뒤 아래 버튼을 누르면,
						다음부터는 구글 로그인만으로 접근할 수 있습니다.
					</p>

					{#if data.isLoggedIn}
						<!-- 로그인 됨 → 바로 등록 -->
						<div class="flex items-center gap-3">
							<span class="text-[13px] text-[#666]">현재 계정: <strong>{data.userEmail}</strong></span>
							<form method="POST" action="?/registerAdmin" use:enhance>
								<button type="submit"
									class="px-5 py-2 bg-[#1A1A1A] text-white text-[13px] font-semibold rounded-xl hover:bg-[#333] transition-colors">
									이 계정을 관리자로 등록
								</button>
							</form>
						</div>
					{:else}
						<!-- 로그인 안 됨 → 구글 로그인 유도 -->
						<a href="/auth/login?next=/admin"
							class="inline-flex items-center gap-2 px-5 py-2 bg-white border border-[#DEDEDE] text-[13px] font-semibold rounded-xl hover:bg-[#F5F5F5] transition-colors shadow-sm">
							<svg class="w-4 h-4" viewBox="0 0 24 24">
								<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
								<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
								<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
								<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
							</svg>
							구글로 로그인하고 관리자 등록
						</a>
					{/if}
				</div>
			{/if}

			<!-- ── 심사 대기 목록 ── -->
			<section>
				<div class="flex items-center gap-3 mb-4">
					<h2 class="text-[15px] font-bold text-[#1A1A1A]">심사 대기</h2>
					<span class="px-2.5 py-0.5 bg-yellow-100 text-yellow-700 text-[12px] font-bold rounded-full">
						{data.pending.length}건
					</span>
				</div>

				{#if data.pending.length === 0}
					<div class="bg-white rounded-2xl border border-[#EBEBEB] px-6 py-12 text-center">
						<div class="text-3xl mb-2">✅</div>
						<p class="text-[14px] text-[#AAAAAA]">심사 대기 중인 프로젝트가 없습니다.</p>
					</div>
				{:else}
					<div class="space-y-4">
						{#each data.pending as p (p.id)}
							<div class="bg-white rounded-2xl border border-[#EBEBEB] overflow-hidden">
								<!-- 프로젝트 정보 -->
								<div class="flex gap-4 p-5">
									<div class="w-28 h-20 rounded-xl overflow-hidden bg-[#F0F0F0] shrink-0">
										{#if p.thumbnail_url}
											<img src={p.thumbnail_url} alt={p.title} class="w-full h-full object-cover" />
										{:else}
											<div class="w-full h-full flex items-center justify-center text-[#CCCCCC] text-2xl">🖼️</div>
										{/if}
									</div>

									<div class="flex-1 min-w-0">
										<div class="flex items-start justify-between gap-2 mb-0.5">
											<div class="min-w-0">
												{#if p.categories}
													<span class="text-[11px] font-bold text-[#00A0A0]">{p.categories.name} · </span>
												{/if}
												<a href="/projects/{p.slug}" target="_blank"
													class="text-[15px] font-bold text-[#1A1A1A] hover:text-[#00A0A0] hover:underline transition-colors">
													{p.title}
												</a>
											</div>
											<span class="text-[11px] text-[#AAAAAA] shrink-0 mt-0.5">
												{formatKoDate(p.created_at)} 제출
											</span>
										</div>
										{#if p.subtitle}
											<p class="text-[13px] text-[#888] mt-0.5 truncate">{p.subtitle}</p>
										{/if}
										<div class="flex flex-wrap items-center gap-3 mt-2 text-[12px] text-[#666]">
											<span>목표 <strong class="text-[#1A1A1A]">{formatKRW(p.goal_amount)}</strong></span>
											{#if p.profiles}
												<span>창작자 <strong class="text-[#1A1A1A]">{p.profiles.display_name ?? '—'}</strong></span>
											{/if}
											{#if p.tags?.length}
												<span class="text-[#BBBBBB]">{p.tags.slice(0, 3).map((t: string) => '#' + t).join(' ')}</span>
											{/if}
										</div>
									</div>
								</div>

								<!-- 액션 바 -->
								<div class="border-t border-[#F0F0F0] px-5 py-3 flex items-center gap-3 bg-[#FAFAFA] flex-wrap">
									<a href="/projects/{p.slug}" target="_blank"
										class="text-[13px] text-[#00A0A0] font-medium hover:underline">
										미리보기 →
									</a>
									<div class="flex-1"></div>

									{#if rejectingId === p.id}
										<form method="POST" action="?/reject" use:enhance
											class="flex items-center gap-2 flex-1 min-w-0"
											onsubmit={() => { rejectingId = null; }}>
											<input type="hidden" name="id" value={p.id} />
											<input
												type="text"
												name="reason"
												bind:value={rejectReason}
												placeholder="반려 사유 (선택사항)"
												class="flex-1 min-w-0 px-3 py-1.5 border border-[#DEDEDE] rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-300"
											/>
											<button type="submit"
												class="px-4 py-1.5 bg-orange-500 text-white text-[13px] font-semibold rounded-lg hover:bg-orange-600 transition-colors shrink-0">
												반려 확정
											</button>
											<button type="button" onclick={cancelReject}
												class="text-[13px] text-[#888] hover:text-[#333] shrink-0 transition-colors">
												취소
											</button>
										</form>
									{:else}
										<button onclick={() => startReject(p.id)}
											class="px-4 py-1.5 border border-orange-300 text-orange-600 text-[13px] font-semibold rounded-lg hover:bg-orange-50 transition-colors">
											반려
										</button>
										<form method="POST" action="?/approve" use:enhance>
											<input type="hidden" name="id" value={p.id} />
											<button type="submit"
												class="px-5 py-1.5 bg-[#00C4C4] text-white text-[13px] font-semibold rounded-lg hover:bg-[#00AFAF] transition-colors">
												✓ 승인
											</button>
										</form>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>

			<!-- ── 최근 처리 내역 ── -->
			<section>
				<h2 class="text-[15px] font-bold text-[#1A1A1A] mb-4">최근 처리 내역</h2>
				<div class="bg-white rounded-2xl border border-[#EBEBEB] overflow-hidden">
					{#if data.recent.length === 0}
						<p class="text-center text-[#AAAAAA] text-[14px] py-8">내역이 없습니다.</p>
					{:else}
						<div class="overflow-x-auto">
							<table class="w-full text-[13px]">
								<thead>
									<tr class="border-b border-[#F0F0F0] text-[#AAAAAA] text-left">
										<th class="px-5 py-3 font-medium">프로젝트</th>
										<th class="px-4 py-3 font-medium">창작자</th>
										<th class="px-4 py-3 font-medium">상태</th>
										<th class="px-4 py-3 font-medium">처리일시</th>
									</tr>
								</thead>
								<tbody>
									{#each data.recent as r (r.id)}
										<tr class="border-b border-[#F7F7F7] hover:bg-[#FAFAFA] transition-colors">
											<td class="px-5 py-3">
												<a href="/projects/{r.slug}" target="_blank"
													class="font-medium text-[#1A1A1A] hover:text-[#00A0A0] hover:underline">
													{r.title}
												</a>
											</td>
											<td class="px-4 py-3 text-[#666]">{r.profiles?.display_name ?? '—'}</td>
											<td class="px-4 py-3">
												{#if statusLabel[r.status]}
													<span class="px-2 py-0.5 rounded-full text-[11px] font-bold {statusLabel[r.status].cls}">
														{statusLabel[r.status].text}
													</span>
												{/if}
											</td>
											<td class="px-4 py-3 text-[#AAAAAA]">{formatKoDate(r.updated_at)}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			</section>

		</div>
	</div>
{/if}
