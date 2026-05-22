import type { PageServerLoad } from './$types';
import type { Database } from '$lib/supabase/types';

type ProjectRow = Database['public']['Tables']['projects']['Row'];

export interface DashboardProject extends Pick<ProjectRow, 'id' | 'title' | 'slug' | 'status' | 'current_amount' | 'goal_amount' | 'backer_count' | 'ends_at' | 'thumbnail_url'> {}

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();

	const { data } = await locals.supabase
		.from('projects')
		.select('id, title, slug, status, current_amount, goal_amount, backer_count, ends_at, thumbnail_url')
		.eq('creator_id', user!.id)
		.order('created_at', { ascending: false });

	return { projects: (data ?? []) as DashboardProject[] };
};
