import { redirect, fail } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) throw redirect(303, '/auth/login?next=/create');

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const sb = locals.supabase as any;

	/** 카테고리 목록 로드 */
	const { data: categories } = await sb
		.from('categories')
		.select('id, name, slug')
		.order('sort_order');

	return {
		user,
		categories: (categories ?? []) as { id: number; name: string; slug: string }[]
	};
};

export const actions: Actions = {
	/** Step 완성 후 draft 프로젝트 저장 */
	save: async ({ locals, request }) => {
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { error: '로그인이 필요합니다.' });

		const fd = await request.formData();

		const title       = (fd.get('title')       as string)?.trim();
		const subtitle    = (fd.get('subtitle')     as string)?.trim() || null;
		const categoryId  = Number(fd.get('category_id'));
		const goalAmount  = Number(fd.get('goal_amount'));
		const startsAt    = (fd.get('starts_at')    as string) || null;
		const endsAt      = (fd.get('ends_at')      as string) || null;
		const storyHtml   = (fd.get('story_html')   as string)?.trim() || null;
		const thumbnailUrl = (fd.get('thumbnail_url') as string)?.trim() || null;
		const tagsRaw     = (fd.get('tags')          as string)?.trim() || '';
		const tags        = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
		const rewardsJson = (fd.get('rewards')       as string) || '[]';

		/** 유효성 검사 */
		if (!title)         return fail(400, { error: '프로젝트 제목을 입력해주세요.' });
		if (!categoryId)    return fail(400, { error: '카테고리를 선택해주세요.' });
		if (!goalAmount || goalAmount < 10000) return fail(400, { error: '목표금액은 10,000원 이상이어야 합니다.' });

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const sb = locals.supabase as any;

		/** slug 생성 (한글 제목 → 알파벳 + nanoid) */
		const slug = nanoid(12).toLowerCase();

		/** 프로필 is_creator 업데이트 */
		await sb.from('profiles').update({ is_creator: true }).eq('id', user.id);

		/** 프로젝트 생성 (story_html 제외 — 경량 insert) */
		const { data: project, error: pErr } = await sb
			.from('projects')
			.insert({
				creator_id:    user.id,
				category_id:   categoryId,
				slug,
				title,
				subtitle,
				thumbnail_url: thumbnailUrl,
				goal_amount:   goalAmount,
				status:        'pending_review',
				starts_at:     startsAt || null,
				ends_at:       endsAt || null,
				tags
			})
			.select('id, slug')
			.single();

		if (pErr || !project) {
			console.error(pErr);
			return fail(500, { error: '프로젝트 등록에 실패했습니다. 다시 시도해주세요.' });
		}

		const projectId = (project as { id: string; slug: string }).id;

		/** 스토리 별도 저장 (project_stories 테이블) */
		if (storyHtml) {
			const { error: storyErr } = await sb
				.from('project_stories')
				.upsert({ project_id: projectId, story_html: storyHtml }, { onConflict: 'project_id' });
			if (storyErr) {
				// 스토리 저장 실패 시 프로젝트 생성 자체는 성공하지만 스토리가 사라질 수 있음
				console.error('[create] project_stories 저장 실패:', storyErr.message, storyErr.code);
				// Fallback: projects.story_html 에도 직접 저장 시도 (구버전 스키마 호환)
				const { error: fallbackErr } = await sb
					.from('projects')
					.update({ story_html: storyHtml } as Record<string, unknown>)
					.eq('id', projectId);
				if (fallbackErr) {
					console.error('[create] fallback story 저장도 실패:', fallbackErr.message);
				}
			}
		}

		/** 리워드 저장 (creator_id 포함) */
		let rewards: Array<{
			title: string;
			description: string;
			amount: number;
			max_quantity: number | null;
			estimated_delivery: string | null;
			is_early_bird: boolean;
		}> = [];
		try { rewards = JSON.parse(rewardsJson); } catch { /* ignore */ }

		if (rewards.length > 0) {
			const rewardRows = rewards.map((r, i) => ({
				project_id:         projectId,
				creator_id:         user.id,          // ← RLS 최적화용
				title:              r.title,
				description:        r.description || null,
				amount:             r.amount,
				max_quantity:       r.max_quantity ?? null,
				estimated_delivery: r.estimated_delivery ?? null,
				is_early_bird:      r.is_early_bird ?? false,
				sort_order:         i
			}));
			await sb.from('rewards').insert(rewardRows);
		}

		throw redirect(303, `/projects/${(project as { id: string; slug: string }).slug}?submitted=1`);

	}
};
