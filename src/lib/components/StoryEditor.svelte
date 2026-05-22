<script lang="ts">
	import { nanoid } from 'nanoid';
	import { getAuthContext } from '$lib/stores/auth.svelte';

	// ──────────────────────────────────────────────
	// 타입 정의
	// ──────────────────────────────────────────────
	type BlockType = 'paragraph' | 'heading' | 'image' | 'video' | 'divider';

	interface Block {
		id:             string;
		type:           BlockType;
		content:        string;  // 텍스트 블록용
		url:            string;  // 미디어 블록용
		caption:        string;  // 미디어 캡션
		uploading:      boolean;
	}

	// ──────────────────────────────────────────────
	// Props / 상태
	// ──────────────────────────────────────────────
	let { storyHtml = $bindable('') }: { storyHtml: string } = $props();

	const auth = getAuthContext();

	function emptyBlock(type: BlockType = 'paragraph'): Block {
		return { id: nanoid(), type, content: '', url: '', caption: '', uploading: false };
	}

	let blocks = $state<Block[]>([emptyBlock()]);

	// blocks → HTML 동기화
	$effect(() => {
		storyHtml = toHtml(blocks);
	});

	function toHtml(bs: Block[]): string {
		return bs.map(b => {
			switch (b.type) {
				case 'paragraph':
					return b.content.trim()
						? `<p>${b.content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\n/g,'<br>')}</p>`
						: '';
				case 'heading':
					return b.content.trim()
						? `<h2>${b.content.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</h2>`
						: '';
				case 'image':
					return b.url
						? `<figure><img src="${b.url}" alt="${b.caption}" loading="lazy" />${b.caption ? `<figcaption>${b.caption}</figcaption>` : ''}</figure>`
						: '';
				case 'video': {
					if (!b.url) return '';
					const isGif = b.url.match(/\.gif(\?|$)/i);
					return isGif
						? `<figure><img src="${b.url}" alt="${b.caption}" loading="lazy" />${b.caption ? `<figcaption>${b.caption}</figcaption>` : ''}</figure>`
						: `<figure><video src="${b.url}" controls playsinline></video>${b.caption ? `<figcaption>${b.caption}</figcaption>` : ''}</figure>`;
				}
				case 'divider':
					return '<hr />';
				default:
					return '';
			}
		}).filter(Boolean).join('\n');
	}

	// ──────────────────────────────────────────────
	// 블록 조작
	// ──────────────────────────────────────────────
	function insertBlock(afterIdx: number, type: BlockType) {
		const nb = emptyBlock(type);
		blocks = [...blocks.slice(0, afterIdx + 1), nb, ...blocks.slice(afterIdx + 1)];
		addMenuIdx = null;

		if (type === 'image' || type === 'video') {
			// 파일 피커 자동 오픈
			setTimeout(() => {
				(document.getElementById(`file-${nb.id}`) as HTMLInputElement | null)?.click();
			}, 50);
		} else if (type !== 'divider') {
			setTimeout(() => {
				(document.getElementById(`text-${nb.id}`) as HTMLElement | null)?.focus();
			}, 50);
		}
	}

	function deleteBlock(idx: number) {
		if (blocks.length <= 1) {
			blocks = [emptyBlock()];
		} else {
			blocks = blocks.filter((_, i) => i !== idx);
		}
	}

	function update(idx: number, patch: Partial<Block>) {
		blocks = blocks.map((b, i) => i === idx ? { ...b, ...patch } : b);
	}

	// ──────────────────────────────────────────────
	// 파일 업로드
	// ──────────────────────────────────────────────
	const IMG_MAX = 10 * 1024 * 1024;   // 10 MB
	const VID_MAX = 100 * 1024 * 1024;  // 100 MB

	async function handleFileUpload(idx: number, files: FileList | null) {
		if (!files?.length) return;
		const file = files[0];

		const isVideo = file.type.startsWith('video/');
		const isImage = file.type.startsWith('image/');
		if (!isVideo && !isImage) {
			alert('이미지(jpg·png·gif·webp) 또는 동영상(mp4·mov·webm) 파일만 가능합니다.');
			return;
		}
		const limit = isVideo ? VID_MAX : IMG_MAX;
		if (file.size > limit) {
			alert(isVideo ? '동영상은 100MB 이하만 업로드할 수 있습니다.' : '이미지는 10MB 이하만 업로드할 수 있습니다.');
			return;
		}

		const blockType: BlockType = isVideo ? 'video' : 'image';
		update(idx, { type: blockType, uploading: true, url: '' });

		const supabase = auth.supabase;
		if (!supabase) { update(idx, { uploading: false }); return; }

		const ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
		const path = `stories/${nanoid()}.${ext}`;

		const { error } = await supabase.storage
			.from('project-thumbnails')
			.upload(path, file, { upsert: false });

		if (error) {
			alert('업로드 실패: ' + error.message);
			update(idx, { uploading: false });
			return;
		}

		const { data: urlData } = supabase.storage
			.from('project-thumbnails')
			.getPublicUrl(path);

		update(idx, { uploading: false, url: urlData.publicUrl });
	}

	// ──────────────────────────────────────────────
	// 드래그 & 드롭 (HTML5 Drag API)
	// ──────────────────────────────────────────────
	let dragIdx     = $state<number | null>(null);
	let dragOverIdx = $state<number | null>(null);

	function onDragStart(i: number) { dragIdx = i; }
	function onDragOver(e: DragEvent, i: number) { e.preventDefault(); dragOverIdx = i; }
	function onDrop(i: number) {
		if (dragIdx !== null && dragIdx !== i) {
			const arr = [...blocks];
			const [moved] = arr.splice(dragIdx, 1);
			arr.splice(i, 0, moved);
			blocks = arr;
		}
		dragIdx = null; dragOverIdx = null;
	}
	function onDragEnd() { dragIdx = null; dragOverIdx = null; }

	// ──────────────────────────────────────────────
	// 추가 메뉴
	// ──────────────────────────────────────────────
	let addMenuIdx = $state<number | null>(null);

	const blockMenuItems: { type: BlockType; icon: string; label: string }[] = [
		{ type: 'paragraph', icon: '📝', label: '텍스트' },
		{ type: 'heading',   icon: '🔠', label: '제목 (H2)' },
		{ type: 'image',     icon: '🖼️', label: '이미지' },
		{ type: 'video',     icon: '🎥', label: '영상 / GIF' },
		{ type: 'divider',   icon: '—',  label: '구분선' },
	];

	// 블록 타입 아이콘
	function typeIcon(t: BlockType) {
		return { paragraph:'¶', heading:'H', image:'🖼', video:'▶', divider:'─' }[t] ?? '·';
	}
</script>

<!-- ══════════════════════════════════════════════════
     스토리 에디터 루트
══════════════════════════════════════════════════ -->
<div class="story-editor rounded-2xl border border-[#DEDEDE] bg-white overflow-hidden">

	<!-- 상단 툴바 -->
	<div class="flex items-center justify-between px-4 py-2.5 border-b border-[#F0F0F0] bg-[#FAFAFA]">
		<span class="text-[12px] font-semibold text-[#666]">스토리 편집기</span>
		<span class="text-[11px] text-[#AAAAAA]">⠿ 드래그로 순서 변경 · + 버튼으로 블록 추가</span>
	</div>

	<!-- 블록 목록 -->
	<div class="divide-y divide-[#F5F5F5]">
		{#each blocks as block, i (block.id)}
			<!-- 드래그 대상 블록 -->
			<div
				draggable={true}
				ondragstart={() => onDragStart(i)}
				ondragover={(e) => onDragOver(e, i)}
				ondrop={() => onDrop(i)}
				ondragend={onDragEnd}
				class="group relative flex gap-2 px-3 py-2 transition-colors
					{dragOverIdx === i && dragIdx !== i ? 'bg-[#F0FDFD] border-t-2 border-[#00C4C4]' : ''}
					{dragIdx === i ? 'opacity-40' : ''}"
			>
				<!-- 드래그 핸들 -->
				<div class="shrink-0 flex flex-col items-center pt-2 gap-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
					<svg class="w-4 h-4 text-[#BBBBBB]" viewBox="0 0 16 16" fill="currentColor">
						<circle cx="5" cy="4" r="1.2"/><circle cx="11" cy="4" r="1.2"/>
						<circle cx="5" cy="8" r="1.2"/><circle cx="11" cy="8" r="1.2"/>
						<circle cx="5" cy="12" r="1.2"/><circle cx="11" cy="12" r="1.2"/>
					</svg>
					<span class="text-[9px] text-[#CCCCCC] leading-none">{typeIcon(block.type)}</span>
				</div>

				<!-- 블록 콘텐츠 -->
				<div class="flex-1 min-w-0">

					{#if block.type === 'paragraph'}
						<textarea
							id="text-{block.id}"
							value={block.content}
							oninput={(e) => update(i, { content: (e.target as HTMLTextAreaElement).value })}
							rows={3}
							placeholder="텍스트를 입력하세요..."
							class="w-full resize-none bg-transparent text-[14px] leading-relaxed text-text-primary outline-none placeholder:text-[#CCCCCC] py-1"
						></textarea>

					{:else if block.type === 'heading'}
						<input
							id="text-{block.id}"
							type="text"
							value={block.content}
							oninput={(e) => update(i, { content: (e.target as HTMLInputElement).value })}
							placeholder="제목을 입력하세요..."
							class="w-full bg-transparent text-[20px] font-bold text-text-primary outline-none placeholder:text-[#CCCCCC] py-1"
						/>

					{:else if block.type === 'image' || block.type === 'video'}
						<!-- 미디어 블록 -->
						<input
							id="file-{block.id}"
							type="file"
							accept={block.type === 'video' ? 'image/gif,video/mp4,video/mov,video/webm,video/quicktime' : 'image/jpeg,image/png,image/webp,image/gif'}
							class="hidden"
							onchange={(e) => handleFileUpload(i, (e.target as HTMLInputElement).files)}
						/>

						{#if block.uploading}
							<!-- 업로드 중 -->
							<div class="flex items-center justify-center h-36 rounded-xl bg-[#F5F5F5] border-2 border-dashed border-[#DEDEDE]">
								<div class="flex flex-col items-center gap-2">
									<svg class="w-6 h-6 animate-spin text-[#00C4C4]" fill="none" viewBox="0 0 24 24">
										<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
										<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
									</svg>
									<span class="text-[12px] text-[#888]">업로드 중...</span>
								</div>
							</div>

						{:else if block.url}
							<!-- 미리보기 -->
							<div class="relative rounded-xl overflow-hidden bg-[#F0F0F0] group/media">
								{#if block.type === 'image' || block.url.match(/\.gif(\?|$)/i)}
									<img src={block.url} alt={block.caption} class="w-full max-h-120 object-contain" />
								{:else}
									<!-- eslint-disable-next-line svelte/media-has-caption -->
									<video src={block.url} controls playsinline class="w-full max-h-120"></video>
								{/if}
								<!-- 교체 버튼 -->
								<button
									type="button"
									onclick={() => (document.getElementById(`file-${block.id}`) as HTMLInputElement | null)?.click()}
									class="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/media:opacity-100 transition-opacity"
								>
									<span class="px-4 py-2 bg-white text-text-primary text-[13px] font-semibold rounded-full shadow">
										교체하기
									</span>
								</button>
							</div>
							<!-- 캡션 -->
							<input
								type="text"
								value={block.caption}
								oninput={(e) => update(i, { caption: (e.target as HTMLInputElement).value })}
								placeholder="캡션 입력 (선택)..."
								class="mt-1.5 w-full bg-transparent text-[12px] text-[#888] outline-none placeholder:text-[#CCCCCC] text-center"
							/>

						{:else}
							<!-- 업로드 유도 -->
							<button
								type="button"
								onclick={() => (document.getElementById(`file-${block.id}`) as HTMLInputElement | null)?.click()}
								class="w-full h-36 rounded-xl border-2 border-dashed border-[#DEDEDE] bg-[#FAFAFA] flex flex-col items-center justify-center gap-2 hover:border-[#00C4C4] hover:bg-[#F0FDFD] transition-colors"
							>
								<span class="text-2xl">{block.type === 'video' ? '🎥' : '🖼️'}</span>
								<span class="text-[13px] text-[#888] font-medium">
									{block.type === 'video' ? '영상 또는 GIF 업로드' : '이미지 업로드'}
								</span>
								<span class="text-[11px] text-[#BBBBBB]">
									{block.type === 'video' ? 'mp4·mov·webm·gif · 최대 100MB' : 'jpg·png·webp·gif · 최대 10MB'}
								</span>
							</button>
						{/if}

					{:else if block.type === 'divider'}
						<div class="py-3 flex items-center">
							<div class="flex-1 border-t-2 border-dashed border-[#E0E0E0]"></div>
							<span class="mx-3 text-[11px] text-[#CCCCCC]">구분선</span>
							<div class="flex-1 border-t-2 border-dashed border-[#E0E0E0]"></div>
						</div>
					{/if}

				</div>

				<!-- 삭제 버튼 -->
				<button
					type="button"
					onclick={() => deleteBlock(i)}
					class="shrink-0 mt-2 p-1 text-[#CCCCCC] hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
					aria-label="블록 삭제"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
					</svg>
				</button>
			</div>

			<!-- ++ 블록 추가 버튼 (각 블록 아래) -->
			<div class="relative flex items-center justify-center py-1 group/add">
				<div class="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-dashed border-transparent group-hover/add:border-[#DEDEDE] transition-colors mx-4"></div>
				<button
					type="button"
					onclick={() => addMenuIdx = addMenuIdx === i ? null : i}
					class="relative z-10 w-6 h-6 rounded-full border border-[#DEDEDE] bg-white text-[#AAAAAA] hover:border-[#00C4C4] hover:text-[#00C4C4] hover:shadow-sm transition-all flex items-center justify-center text-[14px] leading-none opacity-0 group-hover/add:opacity-100"
					aria-label="블록 추가"
				>+</button>

				<!-- 추가 메뉴 -->
				{#if addMenuIdx === i}
					<div class="absolute z-20 top-full mt-1 left-1/2 -translate-x-1/2 bg-white border border-border rounded-xl shadow-lg overflow-hidden min-w-40">
						{#each blockMenuItems as item}
							<button
								type="button"
								onclick={() => insertBlock(i, item.type)}
								class="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-[13px] text-[#333] hover:bg-[#F5F5F5] transition-colors"
							>
								<span class="text-base w-5 text-center">{item.icon}</span>
								{item.label}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- 외부 클릭 시 메뉴 닫기 -->
	{#if addMenuIdx !== null}
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="fixed inset-0 z-10" onclick={() => addMenuIdx = null}></div>
	{/if}

	<!-- 하단: 최초 블록 타입 선택 안내 -->
	<div class="px-4 py-2 border-t border-[#F5F5F5] bg-[#FAFAFA] flex items-center gap-2 flex-wrap">
		<span class="text-[11px] text-[#BBBBBB]">빠른 추가:</span>
		{#each blockMenuItems as item}
			<button
				type="button"
				onclick={() => insertBlock(blocks.length - 1, item.type)}
				class="flex items-center gap-1 px-2 py-1 text-[11px] text-[#888] hover:text-[#00C4C4] hover:bg-[#F0FDFD] rounded-lg transition-colors"
			>
				<span>{item.icon}</span> {item.label}
			</button>
		{/each}
	</div>
</div>
