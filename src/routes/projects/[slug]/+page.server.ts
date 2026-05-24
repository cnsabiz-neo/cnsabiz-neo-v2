import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Database } from '$lib/supabase/types';

type ProjectRow = Database['public']['Tables']['projects']['Row'];
type RewardRow  = Database['public']['Tables']['rewards']['Row'];

// story_html 은 project_stories 에서 별도 fetch → 목록 쿼리 egress 최소화
export interface ProjectDetail extends ProjectRow {
	profiles:   { id: string; display_name: string | null; avatar_url: string | null; is_creator: boolean } | null;
	categories: { name: string; slug: string } | null;
}

export interface UpdateRow {
	id: string; title: string; content_html: string | null; created_at: string;
}

export interface CommentRow {
	id: string; content: string; created_at: string;
	profiles: { display_name: string | null; avatar_url: string | null } | null;
}

export const load: PageServerLoad = async ({ locals, params }) => {
	const supabase = locals.supabase;
	const { session, user } = await locals.safeGetSession();

	// ① 프로젝트 메타 — story_html 도 함께 가져와 fallback으로 사용
	// (project_stories 저장 실패 시 구버전 스키마의 projects.story_html 사용)
	const { data: rawProject, error: projectErr } = await supabase
		.from('projects')
		.select(`
			id, creator_id, category_id, slug, title, subtitle, thumbnail_url,
			goal_amount, current_amount, backer_count,
			status, starts_at, ends_at, is_featured, tags, created_at, updated_at,
			profiles!projects_creator_id_fkey ( id, display_name, avatar_url, is_creator ),
			categories ( name, slug )
		`)
		.eq('slug', params.slug)
		.single();

	// PGRST116 = "0 rows" (진짜 없음) / 그 외 = DB 오류 (컬럼 없음, 권한 등)
	if (projectErr) {
		if (projectErr.code === 'PGRST116') {
			throw error(404, '프로젝트를 찾을 수 없습니다.');
		}
		console.error('[project detail] DB 오류:', projectErr.message, projectErr.code);
		throw error(500, '프로젝트를 불러오는 중 오류가 발생했습니다.');
	}

	const project = rawProject as unknown as ProjectDetail | null;
	if (!project) throw error(404, '프로젝트를 찾을 수 없습니다.');

	const isOwner  = !!user && project.creator_id === user.id;
	const isPublic = ['active', 'funded', 'failed'].includes(project.status);

	// 공개 상태가 아니고 본인도 아니면 404
	if (!isPublic && !isOwner) {
		throw error(404, '프로젝트를 찾을 수 없습니다.');
	}

	// ② 스토리·리워드·업데이트·댓글 병렬 fetch
	const [storyRes, rewardsRes, updatesRes, commentsRes] = await Promise.all([
		// story_html: project_stories 테이블에서 우선 가져옴
		supabase
			.from('project_stories')
			.select('story_html')
			.eq('project_id', project.id)
			.maybeSingle(),  // .single() 대신 → 레코드 없어도 에러 아님

		supabase
			.from('rewards')
			.select('id, project_id, title, description, amount, max_quantity, claimed_count, estimated_delivery, is_early_bird, sort_order')
			.eq('project_id', project.id)
			.order('sort_order'),

		supabase
			.from('project_updates')
			.select('id, title, content_html, created_at')
			.eq('project_id', project.id)
			.eq('is_public', true)
			.order('created_at', { ascending: false })
			.limit(5),

		supabase
			.from('comments')
			.select('id, content, created_at, profiles ( display_name, avatar_url )')
			.eq('project_id', project.id)
			.eq('is_deleted', false)
			.is('parent_id', null)
			.order('created_at', { ascending: false })
			.limit(20)
	]);

	// project_stories 에서 스토리를 가져오지 못했으면 에러 로그
	if (storyRes.error) {
		console.error('[project detail] project_stories 읽기 실패:', storyRes.error.message, storyRes.error.code);
	}

	const resolvedStoryHtml = (storyRes.data as { story_html: string | null } | null)?.story_html ?? null;

	return {
		project,
		storyHtml:  resolvedStoryHtml,
		rewards:    (rewardsRes.data ?? [])  as RewardRow[],
		updates:    (updatesRes.data ?? [])  as UpdateRow[],
		comments:   (commentsRes.data ?? []) as unknown as CommentRow[],
		isLoggedIn: !!session,
		isOwner
	};
};
