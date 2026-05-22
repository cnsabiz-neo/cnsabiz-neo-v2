import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const supabase = locals.supabase;
	const { user } = await locals.safeGetSession();

	const [{ data: featured }, { data: trending }, { data: categories }, { data: likes }] = await Promise.all([
		supabase
			.from('projects')
			.select('*, profiles(display_name, avatar_url), categories(name)')
			.eq('status', 'active')
			.eq('is_featured', true)
			.order('created_at', { ascending: false })
			.limit(5),

		supabase
			.from('projects')
			.select('*, profiles(display_name, avatar_url), categories(name)')
			.eq('status', 'active')
			.order('backer_count', { ascending: false })
			.limit(12),

		supabase.from('categories').select('*').order('sort_order'),

		// 로그인한 사용자의 찜 목록
		user
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			? (supabase as any).from('project_likes').select('project_id').eq('user_id', user.id)
			: Promise.resolve({ data: [] })
	]);

	const likedIds = new Set<string>((likes ?? []).map((l: { project_id: string }) => l.project_id));

	return {
		featured: featured ?? [],
		trending: trending ?? [],
		categories: categories ?? [],
		likedIds: [...likedIds]
	};
};
