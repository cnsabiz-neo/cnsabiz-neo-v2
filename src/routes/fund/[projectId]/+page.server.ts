import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Database } from '$lib/supabase/types';

type ProjectRow = Database['public']['Tables']['projects']['Row'];
type RewardRow = Database['public']['Tables']['rewards']['Row'];

export interface FundProject extends Pick<ProjectRow, 'id' | 'title' | 'subtitle' | 'thumbnail_url' | 'goal_amount' | 'current_amount' | 'status' | 'ends_at'> {}

export const load: PageServerLoad = async ({ locals, params }) => {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) throw redirect(303, `/auth/login?next=/fund/${params.projectId}`);

	const { data: rawProject } = await locals.supabase
		.from('projects')
		.select('id, title, subtitle, thumbnail_url, goal_amount, current_amount, status, ends_at')
		.eq('id', params.projectId)
		.eq('status', 'active')
		.single();

	const project = rawProject as FundProject | null;
	if (!project) throw error(404, '진행 중인 프로젝트가 아닙니다.');

	const { data: rawRewards } = await locals.supabase
		.from('rewards')
		.select('*')
		.eq('project_id', params.projectId)
		.order('sort_order');

	return {
		project,
		rewards: (rawRewards ?? []) as RewardRow[]
	};
};
