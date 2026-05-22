<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from '$lib/stores/toast.svelte';
	import { formatKRW } from '$lib/utils/currency';
	import { getAuthContext } from '$lib/stores/auth.svelte';
	import StoryEditor from '$lib/components/StoryEditor.svelte';

	const auth = getAuthContext();

	let { data, form } = $props();

	// ──────────────────────────────────────────────
	// 스텝 관리
	// ──────────────────────────────────────────────
	const STEPS = [
		{ label: '기본 정보' },
		{ label: '스토리' },
		{ label: '리워드' },
		{ label: '검토 및 제출' }
	];
	let step = $state(0); // 0-based

	// ──────────────────────────────────────────────
	// 폼 데이터
	// ──────────────────────────────────────────────
	let title       = $state('');
	let subtitle    = $state('');
	let categoryId  = $state<number | ''>('');
	let goalAmount  = $state('');
	let startsAt    = $state('');
	let endsAt      = $state('');
	let thumbnailUrl    = $state('');
	let thumbUploading  = $state(false);  // 업로드 중 여부
	let storyHtml       = $state('');     // StoryEditor 에서 바인딩되는 HTML
	let tagsInput   = $state('');

	// ──────────────────────────────────────────────
	// 리워드
	// ──────────────────────────────────────────────
	interface Reward {
		id: string;
		title: string;
		description: string;
		amount: string;
		max_quantity: string;
		estimated_delivery: string;
		is_early_bird: boolean;
	}

	let rewards = $state<Reward[]>([]);
	let rewardDraft = $state<Reward>(emptyReward());
	let editingIdx = $state<number | null>(null);
	let showRewardForm = $state(false);

	function emptyReward(): Reward {
		return {
			id: crypto.randomUUID(),
			title: '',
			description: '',
			amount: '',
			max_quantity: '',
			estimated_delivery: '',
			is_early_bird: false
		};
	}

	function openAddReward() {
		rewardDraft = emptyReward();
		editingIdx = null;
		showRewardForm = true;
	}

	function openEditReward(idx: number) {
		rewardDraft = { ...rewards[idx] };
		editingIdx = idx;
		showRewardForm = true;
	}

	function saveReward() {
		if (!rewardDraft.title.trim()) { toast.error('리워드 이름을 입력해주세요.'); return; }
		const amt = Number(rewardDraft.amount);
		if (!amt || amt < 1000) { toast.error('리워드 금액은 1,000원 이상이어야 합니다.'); return; }

		if (editingIdx !== null) {
			rewards[editingIdx] = { ...rewardDraft };
		} else {
			rewards = [...rewards, { ...rewardDraft }];
		}
		showRewardForm = false;
	}

	function removeReward(idx: number) {
		rewards = rewards.filter((_, i) => i !== idx);
	}

	// ──────────────────────────────────────────────
	// 스텝 유효성
	// ──────────────────────────────────────────────
	function validateStep(s: number): boolean {
		if (s === 0) {
			if (!title.trim())    { toast.error('프로젝트 제목을 입력해주세요.'); return false; }
			if (!categoryId)      { toast.error('카테고리를 선택해주세요.'); return false; }
			const g = Number(goalAmount);
			if (!g || g < 10000) { toast.error('목표금액은 10,000원 이상이어야 합니다.'); return false; }
			if (!endsAt)          { toast.error('펀딩 마감일을 선택해주세요.'); return false; }
		}
		if (s === 2) {
			if (rewards.length === 0) { toast.error('리워드를 1개 이상 추가해주세요.'); return false; }
		}
		return true;
	}

	function nextStep() {
		if (!validateStep(step)) return;
		step = Math.min(step + 1, STEPS.length - 1);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function prevStep() {
		step = Math.max(step - 1, 0);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	// ──────────────────────────────────────────────
	// 썸네일 파일 업로드 (Supabase Storage) — 자동 16:9 크롭
	// ──────────────────────────────────────────────

	/** Canvas로 이미지를 중앙 기준 16:9 크롭 후 JPEG Blob 반환 */
	function cropTo16x9(file: File): Promise<Blob> {
		return new Promise((resolve, reject) => {
			const img = new Image();
			const objectUrl = URL.createObjectURL(file);

			img.onload = () => {
				URL.revokeObjectURL(objectUrl);

				const TARGET = 16 / 9;
				const srcRatio = img.width / img.height;

				let sx = 0, sy = 0, sw = img.width, sh = img.height;

				if (srcRatio > TARGET) {
					// 원본이 더 넓음 → 좌우를 잘라 중앙만 사용
					sw = Math.round(img.height * TARGET);
					sx = Math.round((img.width - sw) / 2);
				} else if (srcRatio < TARGET) {
					// 원본이 더 좁음 → 상하를 잘라 중앙만 사용
					sh = Math.round(img.width / TARGET);
					sy = Math.round((img.height - sh) / 2);
				}

				// 출력 해상도: 최대 1280 × 720
				const outW = Math.min(sw, 1280);
				const outH = Math.round(outW / TARGET);

				const canvas = document.createElement('canvas');
				canvas.width  = outW;
				canvas.height = outH;

				const ctx = canvas.getContext('2d');
				if (!ctx) { reject(new Error('Canvas 2D 컨텍스트를 가져올 수 없습니다.')); return; }

				ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

				canvas.toBlob(
					(blob) => { blob ? resolve(blob) : reject(new Error('Canvas toBlob 실패')); },
					'image/jpeg',
					0.92  // JPEG 품질 92%
				);
			};

			img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('이미지 로드 실패')); };
			img.src = objectUrl;
		});
	}

	async function handleThumbFile(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;

		// 타입 검사
		if (!file.type.startsWith('image/')) {
			toast.error('이미지 파일만 업로드할 수 있습니다.');
			return;
		}
		// 원본 10MB 이하 허용 (크롭 후 용량 줄어듦)
		if (file.size > 10 * 1024 * 1024) {
			toast.error('파일 크기는 10MB 이하여야 합니다.');
			return;
		}

		if (!auth.supabase) { toast.error('로그인이 필요합니다.'); return; }
		thumbUploading = true;

		try {
			// 16:9 자동 크롭
			const croppedBlob = await cropTo16x9(file);
			const path = `${crypto.randomUUID()}.jpg`;

			const { error: upErr } = await auth.supabase.storage
				.from('project-thumbnails')
				.upload(path, croppedBlob, { upsert: false, contentType: 'image/jpeg' });

			if (upErr) {
				toast.error('업로드에 실패했습니다: ' + upErr.message);
				thumbUploading = false;
				return;
			}

			const { data: urlData } = auth.supabase.storage
				.from('project-thumbnails')
				.getPublicUrl(path);

			thumbnailUrl  = urlData.publicUrl;
			toast.success('이미지가 16:9 비율로 자동 조정됐습니다.');
		} catch (err) {
			toast.error('이미지 처리 중 오류가 발생했습니다.');
		} finally {
			thumbUploading = false;
		}
	}

	function removeThumb() {
		thumbnailUrl = '';
	}

	// storyHtml 은 StoryEditor 컴포넌트가 bind:storyHtml 로 직접 업데이트됨

	// ──────────────────────────────────────────────
	// 제출 (리워드 JSON 직렬화)
	// ──────────────────────────────────────────────
	const rewardsJson = $derived(
		JSON.stringify(rewards.map(r => ({
			title:              r.title,
			description:        r.description,
			amount:             Number(r.amount),
			max_quantity:       r.max_quantity ? Number(r.max_quantity) : null,
			estimated_delivery: r.estimated_delivery || null,
			is_early_bird:      r.is_early_bird
		})))
	);

	let submitting = $state(false);

	// 서버 에러 표시
	$effect(() => {
		if (form?.error) toast.error(form.error as string);
	});

	// 오늘 날짜(min)
	const today = new Date().toISOString().slice(0, 10);

	// 미리보기 목표금액
	const goalPreview = $derived(() => {
		const n = Number(goalAmount);
		return n > 0 ? formatKRW(n) : '—';
	});
</script>

<svelte:head><title>프로젝트 만들기 — 큰사비즈</title></svelte:head>

<!-- ──────────────────────── 상단 스텝 바 ──────────────────────── -->
<div class="bg-white border-b border-[#EBEBEB] sticky top-14 z-30">
	<div class="max-w-3xl mx-auto px-4 py-0">
		<div class="flex">
			{#each STEPS as s, i}
				<button
					type="button"
					onclick={() => { if (i < step) step = i; }}
					class="flex-1 py-4 text-[13px] font-semibold border-b-2 transition-colors
						{i === step
							? 'border-[#00C4C4] text-[#00C4C4]'
							: i < step
								? 'border-[#CCEEEE] text-[#888] cursor-pointer hover:text-[#00C4C4]'
								: 'border-transparent text-[#BBBBBB] cursor-default'}"
				>
					<span class="inline-flex items-center gap-1.5">
						<span class="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold
							{i === step ? 'bg-[#00C4C4] text-white' : i < step ? 'bg-[#CCEEEE] text-[#00A0A0]' : 'bg-[#F0F0F0] text-[#BBBBBB]'}">
							{#if i < step}
								<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
								</svg>
							{:else}
								{i + 1}
							{/if}
						</span>
						{s.label}
					</span>
				</button>
			{/each}
		</div>
	</div>
</div>

<!-- ──────────────────────── 메인 콘텐츠 ──────────────────────── -->
<div class="max-w-3xl mx-auto px-4 py-10">

	<!-- STEP 0: 기본 정보 -->
	{#if step === 0}
		<section>
			<h2 class="text-[22px] font-bold text-[#1A1A1A] mb-1">프로젝트 기본 정보</h2>
			<p class="text-[14px] text-[#888] mb-8">펀딩의 핵심 정보를 입력해주세요.</p>

			<div class="space-y-6">
				<!-- 제목 -->
				<div>
					<label for="f-title" class="block text-[13px] font-semibold text-[#333] mb-1.5">
						프로젝트 제목 <span class="text-[#00C4C4]">*</span>
					</label>
					<input
						id="f-title"
						type="text"
						bind:value={title}
						maxlength="60"
						placeholder="예) 충남삼성고 환경 캠페인 — 바다를 지키는 첫걸음"
						class="w-full px-4 py-3 border border-[#DCDCDC] rounded-xl text-[14px] focus:outline-none focus:border-[#00C4C4] focus:ring-2 focus:ring-[#00C4C420] transition-all placeholder:text-[#C0C0C0]"
					/>
					<p class="mt-1 text-[11px] text-[#AAAAAA] text-right">{title.length}/60</p>
				</div>

				<!-- 부제목 -->
				<div>
					<label for="f-subtitle" class="block text-[13px] font-semibold text-[#333] mb-1.5">
						부제목 <span class="text-[#BBBBBB] font-normal">(선택)</span>
					</label>
					<input
						id="f-subtitle"
						type="text"
						bind:value={subtitle}
						maxlength="100"
						placeholder="한 줄로 프로젝트를 설명해주세요."
						class="w-full px-4 py-3 border border-[#DCDCDC] rounded-xl text-[14px] focus:outline-none focus:border-[#00C4C4] focus:ring-2 focus:ring-[#00C4C420] transition-all placeholder:text-[#C0C0C0]"
					/>
				</div>

				<!-- 카테고리 -->
				<div>
					<label for="f-category" class="block text-[13px] font-semibold text-[#333] mb-1.5">
						카테고리 <span class="text-[#00C4C4]">*</span>
					</label>
					<select
						id="f-category"
						bind:value={categoryId}
						class="w-full px-4 py-3 border border-[#DCDCDC] rounded-xl text-[14px] focus:outline-none focus:border-[#00C4C4] focus:ring-2 focus:ring-[#00C4C420] transition-all bg-white appearance-none"
					>
						<option value="">카테고리 선택</option>
						{#each data.categories as cat}
							<option value={cat.id}>{cat.name}</option>
						{/each}
					</select>
				</div>

				<!-- 목표 금액 -->
				<div>
					<label for="f-goal" class="block text-[13px] font-semibold text-[#333] mb-1.5">
						목표 금액 <span class="text-[#00C4C4]">*</span>
					</label>
					<div class="relative">
						<input
							id="f-goal"
							type="number"
							bind:value={goalAmount}
							min="10000"
							step="1000"
							placeholder="10,000"
							class="w-full pl-4 pr-12 py-3 border border-[#DCDCDC] rounded-xl text-[14px] focus:outline-none focus:border-[#00C4C4] focus:ring-2 focus:ring-[#00C4C420] transition-all placeholder:text-[#C0C0C0]"
						/>
						<span class="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-[#888]">원</span>
					</div>
					{#if Number(goalAmount) > 0}
						<p class="mt-1 text-[12px] text-[#00A0A0] font-semibold">= {goalPreview()}</p>
					{/if}
				</div>

				<!-- 펀딩 기간 -->
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="f-starts" class="block text-[13px] font-semibold text-[#333] mb-1.5">
							펀딩 시작일 <span class="text-[#BBBBBB] font-normal">(선택)</span>
						</label>
						<input
							id="f-starts"
							type="date"
							bind:value={startsAt}
							min={today}
							class="w-full px-4 py-3 border border-[#DCDCDC] rounded-xl text-[14px] focus:outline-none focus:border-[#00C4C4] focus:ring-2 focus:ring-[#00C4C420] transition-all"
						/>
					</div>
					<div>
						<label for="f-ends" class="block text-[13px] font-semibold text-[#333] mb-1.5">
							펀딩 마감일 <span class="text-[#00C4C4]">*</span>
						</label>
						<input
							id="f-ends"
							type="date"
							bind:value={endsAt}
							min={startsAt || today}
							class="w-full px-4 py-3 border border-[#DCDCDC] rounded-xl text-[14px] focus:outline-none focus:border-[#00C4C4] focus:ring-2 focus:ring-[#00C4C420] transition-all"
						/>
					</div>
				</div>

				<!-- 태그 -->
				<div>
					<label for="f-tags" class="block text-[13px] font-semibold text-[#333] mb-1.5">
						태그 <span class="text-[#BBBBBB] font-normal">(쉼표로 구분, 최대 5개)</span>
					</label>
					<input
						id="f-tags"
						type="text"
						bind:value={tagsInput}
						placeholder="예) 환경, 제로웨이스트, 학생창업"
						class="w-full px-4 py-3 border border-[#DCDCDC] rounded-xl text-[14px] focus:outline-none focus:border-[#00C4C4] focus:ring-2 focus:ring-[#00C4C420] transition-all placeholder:text-[#C0C0C0]"
					/>
					{#if tagsInput}
						<div class="flex flex-wrap gap-1.5 mt-2">
							{#each tagsInput.split(',').map(t => t.trim()).filter(Boolean).slice(0, 5) as tag}
								<span class="px-2.5 py-1 bg-[#F0FDFD] text-[#00A0A0] text-[11px] font-semibold rounded-full border border-[#CCEEEE]">
									#{tag}
								</span>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</section>
	{/if}

	<!-- STEP 1: 스토리 (StoryEditor를 항상 DOM에 유지 — unmount 시 blocks 초기화 방지) -->
	<section class="{step !== 1 ? 'hidden' : ''}">
		<h2 class="text-[22px] font-bold text-[#1A1A1A] mb-1">프로젝트 스토리</h2>
		<p class="text-[14px] text-[#888] mb-8">후원자들에게 프로젝트를 소개해주세요.</p>

			<div class="space-y-6">

				<!-- 대표 이미지 업로드 -->
				<div>
					<div class="flex items-center gap-2 mb-1.5">
						<p class="text-[13px] font-semibold text-[#333]">대표 이미지</p>
						<span class="px-1.5 py-0.5 bg-[#E6FAFA] text-[#007A7A] text-[10px] font-bold rounded">16:9</span>
						<span class="text-[#BBBBBB] text-[12px] font-normal">(선택 · 자동 크롭)</span>
					</div>

					{#if thumbnailUrl}
						<!-- 업로드 완료 — 미리보기 -->
						<div class="relative rounded-xl overflow-hidden border border-[#EBEBEB] aspect-video bg-[#F5F5F5]">
							<img src={thumbnailUrl} alt="대표 이미지" class="w-full h-full object-cover" />
							<button
								type="button"
								onclick={removeThumb}
								class="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
								title="이미지 제거"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
								</svg>
							</button>
						</div>
					{:else}
						<!-- 업로드 전 — 드롭존 -->
						<label
							for="f-thumb"
							class="mt-1 flex flex-col items-center justify-center gap-3 aspect-video rounded-xl border-2 border-dashed
								{thumbUploading ? 'border-[#00C4C4] bg-[#F0FDFD]' : 'border-[#DCDCDC] bg-[#FAFAFA] hover:border-[#00C4C4] hover:bg-[#F0FDFD]'}
								cursor-pointer transition-colors"
						>
							{#if thumbUploading}
								<svg class="w-8 h-8 text-[#00C4C4] animate-spin" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
								</svg>
								<span class="text-[13px] text-[#00C4C4] font-semibold">업로드 중…</span>
							{:else}
								<svg class="w-10 h-10 text-[#CCCCCC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
								</svg>
								<div class="text-center">
									<p class="text-[13px] font-semibold text-[#555]">클릭하여 이미지 선택</p>
									<p class="text-[11px] text-[#AAAAAA] mt-0.5">JPG, PNG, WEBP · 최대 10MB</p>
									<p class="text-[11px] text-[#00A0A0] mt-1 font-medium">어떤 비율이든 자동으로 16:9로 크롭됩니다</p>
								</div>
							{/if}
						</label>
						<input
							id="f-thumb"
							type="file"
							accept="image/*"
							onchange={handleThumbFile}
							disabled={thumbUploading}
							class="sr-only"
						/>
					{/if}
				</div>

				<!-- 프로젝트 스토리 에디터 -->
				<div>
					<div class="flex items-center justify-between mb-1.5">
						<span class="text-[13px] font-semibold text-[#333]">
							프로젝트 스토리 <span class="text-[#BBBBBB] font-normal">(선택)</span>
						</span>
						<span class="text-[11px] text-[#AAAAAA]">텍스트·이미지·영상·GIF 자유롭게 구성</span>
					</div>
					<StoryEditor bind:storyHtml />
				</div>
			</div>
	</section>

	<!-- STEP 2: 리워드 -->
	{#if step === 2}
		<section>
			<h2 class="text-[22px] font-bold text-[#1A1A1A] mb-1">리워드 설정</h2>
			<p class="text-[14px] text-[#888] mb-8">후원자에게 제공할 리워드를 1개 이상 추가해주세요.</p>

			<!-- 리워드 목록 -->
			{#if rewards.length > 0}
				<div class="space-y-3 mb-5">
					{#each rewards as r, i}
						<div class="border border-[#EBEBEB] rounded-xl p-4 flex items-start gap-3 hover:border-[#CCEEEE] transition-colors">
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 flex-wrap mb-1">
									<span class="font-bold text-[14px] text-[#1A1A1A] truncate">{r.title}</span>
									{#if r.is_early_bird}
										<span class="px-2 py-0.5 bg-[#FFF0E6] text-[#E05000] text-[10px] font-bold rounded-full">얼리버드</span>
									{/if}
								</div>
								<p class="text-[20px] font-bold text-[#00C4C4] mb-1">{formatKRW(Number(r.amount))}</p>
								{#if r.description}
									<p class="text-[12px] text-[#888] line-clamp-2">{r.description}</p>
								{/if}
								<div class="flex flex-wrap gap-3 mt-2 text-[11px] text-[#AAAAAA]">
									{#if r.max_quantity}
										<span>수량 제한: {Number(r.max_quantity).toLocaleString()}개</span>
									{:else}
										<span>수량 제한 없음</span>
									{/if}
									{#if r.estimated_delivery}
										<span>예상 전달: {r.estimated_delivery}</span>
									{/if}
								</div>
							</div>
							<div class="flex gap-1 shrink-0">
								<button
									type="button"
									onclick={() => openEditReward(i)}
									class="p-2 rounded-lg text-[#888] hover:bg-[#F5F5F5] hover:text-[#00C4C4] transition-colors"
									title="수정"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
									</svg>
								</button>
								<button
									type="button"
									onclick={() => removeReward(i)}
									class="p-2 rounded-lg text-[#888] hover:bg-[#FFF0F0] hover:text-[#E04040] transition-colors"
									title="삭제"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
									</svg>
								</button>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="border-2 border-dashed border-[#DCDCDC] rounded-xl py-10 text-center text-[#BBBBBB] mb-5">
					<svg class="w-10 h-10 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v13m0-13V6a2 2 0 112.83 2.83l-2.83 2.83V8zm0 0V5.5A2.5 2.5 0 109.5 8H12z"/>
					</svg>
					<p class="text-[13px]">아직 리워드가 없습니다</p>
				</div>
			{/if}

			<!-- 리워드 추가 버튼 -->
			{#if !showRewardForm}
				<button
					type="button"
					onclick={openAddReward}
					class="w-full py-3.5 border-2 border-dashed border-[#00C4C4] text-[#00C4C4] font-semibold text-[14px] rounded-xl hover:bg-[#F0FDFD] transition-colors flex items-center justify-center gap-2"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
					</svg>
					리워드 추가
				</button>
			{/if}

			<!-- 리워드 입력 폼 -->
			{#if showRewardForm}
				<div class="border-2 border-[#00C4C4] rounded-xl p-5 space-y-4">
					<h3 class="text-[15px] font-bold text-[#1A1A1A]">
						{editingIdx !== null ? '리워드 수정' : '새 리워드'}
					</h3>

					<!-- 리워드명 -->
					<div>
						<label for="r-title" class="block text-[12px] font-semibold text-[#555] mb-1">
							리워드명 <span class="text-[#00C4C4]">*</span>
						</label>
						<input
							id="r-title"
							type="text"
							bind:value={rewardDraft.title}
							maxlength="60"
							placeholder="예) 감사 엽서 + 이름 등재"
							class="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg text-[13px] focus:outline-none focus:border-[#00C4C4] transition-all"
						/>
					</div>

					<!-- 리워드 설명 -->
					<div>
						<label for="r-desc" class="block text-[12px] font-semibold text-[#555] mb-1">설명</label>
						<textarea
							id="r-desc"
							bind:value={rewardDraft.description}
							rows="3"
							placeholder="리워드에 포함되는 내용을 설명해주세요."
							class="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg text-[13px] focus:outline-none focus:border-[#00C4C4] transition-all resize-none"
						></textarea>
					</div>

					<!-- 금액 + 수량 -->
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label for="r-amount" class="block text-[12px] font-semibold text-[#555] mb-1">
								후원 금액 <span class="text-[#00C4C4]">*</span>
							</label>
							<div class="relative">
								<input
									id="r-amount"
									type="number"
									bind:value={rewardDraft.amount}
									min="1000"
									step="1000"
									placeholder="10,000"
									class="w-full pl-3 pr-8 py-2.5 border border-[#DCDCDC] rounded-lg text-[13px] focus:outline-none focus:border-[#00C4C4] transition-all"
								/>
								<span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#888]">원</span>
							</div>
						</div>
						<div>
							<label for="r-qty" class="block text-[12px] font-semibold text-[#555] mb-1">
								최대 수량 <span class="text-[#888] font-normal">(빈칸=무제한)</span>
							</label>
							<input
								id="r-qty"
								type="number"
								bind:value={rewardDraft.max_quantity}
								min="1"
								placeholder="무제한"
								class="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg text-[13px] focus:outline-none focus:border-[#00C4C4] transition-all"
							/>
						</div>
					</div>

					<!-- 예상 전달 + 얼리버드 -->
					<div class="grid grid-cols-2 gap-3">
						<div>
							<label for="r-delivery" class="block text-[12px] font-semibold text-[#555] mb-1">예상 전달 시기</label>
							<input
								id="r-delivery"
								type="month"
								bind:value={rewardDraft.estimated_delivery}
								class="w-full px-3 py-2.5 border border-[#DCDCDC] rounded-lg text-[13px] focus:outline-none focus:border-[#00C4C4] transition-all"
							/>
						</div>
						<div class="flex items-end pb-2.5">
							<label class="flex items-center gap-2 cursor-pointer select-none">
								<input
									type="checkbox"
									bind:checked={rewardDraft.is_early_bird}
									class="w-4 h-4 accent-[#00C4C4] rounded"
								/>
								<span class="text-[12px] font-semibold text-[#555]">얼리버드 리워드</span>
							</label>
						</div>
					</div>

					<!-- 폼 버튼 -->
					<div class="flex gap-2 pt-1">
						<button
							type="button"
							onclick={saveReward}
							class="flex-1 py-2.5 bg-[#00C4C4] text-white font-semibold text-[13px] rounded-lg hover:bg-[#00AFAF] transition-colors"
						>
							{editingIdx !== null ? '수정 완료' : '리워드 추가'}
						</button>
						<button
							type="button"
							onclick={() => { showRewardForm = false; }}
							class="px-4 py-2.5 border border-[#EBEBEB] text-[#888] font-semibold text-[13px] rounded-lg hover:border-[#AAAAAA] transition-colors"
						>
							취소
						</button>
					</div>
				</div>
			{/if}
		</section>
	{/if}

	<!-- STEP 3: 검토 및 제출 -->
	{#if step === 3}
		<section>
			<h2 class="text-[22px] font-bold text-[#1A1A1A] mb-1">검토 및 제출</h2>
			<p class="text-[14px] text-[#888] mb-8">입력한 내용을 확인하고 심사를 신청하세요.</p>

			<div class="space-y-4">
				<!-- 기본 정보 요약 -->
				<div class="bg-white border border-[#EBEBEB] rounded-2xl overflow-hidden">
					<div class="bg-[#F8F8F8] px-5 py-3 flex items-center justify-between">
						<span class="text-[13px] font-bold text-[#333]">기본 정보</span>
						<button type="button" onclick={() => { step = 0; }} class="text-[12px] text-[#00C4C4] font-semibold hover:underline">수정</button>
					</div>
					<div class="p-5 space-y-3">
						<div class="flex gap-3">
							{#if thumbnailUrl}
								<img src={thumbnailUrl} alt="" class="w-20 h-14 rounded-lg object-cover shrink-0 border border-[#EBEBEB]" />
							{/if}
							<div>
								<p class="font-bold text-[15px] text-[#1A1A1A] leading-snug">{title}</p>
								{#if subtitle}<p class="text-[12px] text-[#888] mt-0.5">{subtitle}</p>{/if}
							</div>
						</div>
						<div class="grid grid-cols-2 gap-2 text-[12px]">
							<div class="flex justify-between">
								<span class="text-[#888]">카테고리</span>
								<span class="font-semibold">{data.categories.find(c => c.id === categoryId)?.name ?? '—'}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-[#888]">목표금액</span>
								<span class="font-bold text-[#00C4C4]">{goalPreview()}</span>
							</div>
							<div class="flex justify-between col-span-2">
								<span class="text-[#888]">펀딩 기간</span>
								<span class="font-semibold">
									{startsAt || '즉시'} ~ {endsAt || '—'}
								</span>
							</div>
							{#if tagsInput}
								<div class="flex items-start justify-between col-span-2">
									<span class="text-[#888]">태그</span>
									<div class="flex flex-wrap gap-1 justify-end">
										{#each tagsInput.split(',').map(t => t.trim()).filter(Boolean).slice(0,5) as tag}
											<span class="px-1.5 py-0.5 bg-[#F0FDFD] text-[#00A0A0] text-[10px] font-semibold rounded-full">#{tag}</span>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- 스토리 요약 -->
				<div class="bg-white border border-[#EBEBEB] rounded-2xl overflow-hidden">
					<div class="bg-[#F8F8F8] px-5 py-3 flex items-center justify-between">
						<span class="text-[13px] font-bold text-[#333]">스토리</span>
						<button type="button" onclick={() => { step = 1; }} class="text-[12px] text-[#00C4C4] font-semibold hover:underline">수정</button>
					</div>
					<div class="p-5">
						{#if storyHtml.trim()}
							<!-- 에디터 HTML을 텍스트로 표시 (간략 미리보기) -->
							<p class="text-[13px] text-[#555] line-clamp-3">
								{storyHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g,' ').trim().slice(0, 200)}…
							</p>
						{:else}
							<p class="text-[13px] text-[#BBBBBB] italic">스토리가 입력되지 않았습니다.</p>
						{/if}
					</div>
				</div>

				<!-- 리워드 요약 -->
				<div class="bg-white border border-[#EBEBEB] rounded-2xl overflow-hidden">
					<div class="bg-[#F8F8F8] px-5 py-3 flex items-center justify-between">
						<span class="text-[13px] font-bold text-[#333]">리워드 ({rewards.length}개)</span>
						<button type="button" onclick={() => { step = 2; }} class="text-[12px] text-[#00C4C4] font-semibold hover:underline">수정</button>
					</div>
					<div class="p-5 space-y-2">
						{#each rewards as r}
							<div class="flex items-center justify-between">
								<span class="text-[13px] text-[#333] truncate">{r.title}</span>
								<span class="text-[13px] font-bold text-[#00C4C4] shrink-0 ml-2">{formatKRW(Number(r.amount))}</span>
							</div>
						{/each}
					</div>
				</div>

				<!-- 안내 -->
				<div class="bg-[#FFFBF0] border border-[#FFE8B0] rounded-xl p-4">
					<p class="text-[12px] font-semibold text-[#886600] flex items-center gap-1.5 mb-1">
						<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
						</svg>
						제출 전 확인사항
					</p>
					<ul class="text-[12px] text-[#886600] pl-5 list-disc space-y-0.5">
						<li>제출 후 관리자 심사를 거쳐 <strong>1~3 영업일</strong> 내에 오픈됩니다.</li>
						<li>심사 중에는 수정이 제한될 수 있습니다.</li>
						<li>큰사비즈 이용약관 및 창작자 가이드를 준수해야 합니다.</li>
					</ul>
				</div>
			</div>

			<!-- 제출 폼 -->
			<form
				method="POST"
				action="?/save"
				use:enhance={() => {
					submitting = true;
					return async ({ result, update }) => {
						submitting = false;
						if (result.type === 'failure') {
							const err = (result.data as { error?: string })?.error;
							if (err) toast.error(err);
						}
						await update();
					};
				}}
				class="mt-6"
			>
				<!-- 숨김 필드: 수집된 데이터 전달 -->
				<input type="hidden" name="title"         value={title} />
				<input type="hidden" name="subtitle"      value={subtitle} />
				<input type="hidden" name="category_id"   value={categoryId} />
				<input type="hidden" name="goal_amount"   value={goalAmount} />
				<input type="hidden" name="starts_at"     value={startsAt} />
				<input type="hidden" name="ends_at"       value={endsAt} />
				<input type="hidden" name="thumbnail_url" value={thumbnailUrl} />
				<input type="hidden" name="story_html"    value={storyHtml} />
				<input type="hidden" name="tags"          value={tagsInput} />
				<input type="hidden" name="rewards"       value={rewardsJson} />

				<button
					type="submit"
					disabled={submitting}
					class="w-full py-4 bg-[#00C4C4] text-white font-bold text-[16px] rounded-xl hover:bg-[#00AFAF] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
				>
					{#if submitting}
						<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
						</svg>
						심사 신청 중…
					{:else}
						심사 신청하기
					{/if}
				</button>
			</form>
		</section>
	{/if}

	<!-- ──────────────────────── 하단 네비 버튼 ──────────────────────── -->
	{#if step < 3}
		<div class="flex gap-3 mt-10 pt-6 border-t border-[#F0F0F0]">
			{#if step > 0}
				<button
					type="button"
					onclick={prevStep}
					class="flex-1 py-3.5 border border-[#DCDCDC] text-[#555] font-semibold text-[15px] rounded-xl hover:border-[#AAAAAA] transition-colors"
				>
					← 이전
				</button>
			{/if}
			<button
				type="button"
				onclick={nextStep}
				class="flex-1 py-3.5 bg-[#00C4C4] text-white font-bold text-[15px] rounded-xl hover:bg-[#00AFAF] transition-colors"
			>
				{step === 2 ? '검토하기 →' : '다음 →'}
			</button>
		</div>
	{/if}

</div>
