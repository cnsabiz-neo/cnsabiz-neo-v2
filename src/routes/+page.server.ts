import type { PageServerLoad } from './$types';
import { getLikedProjectIds } from '$lib/supabase/likes';

export const load: PageServerLoad = async ({ locals }) => {
	const supabase = locals.supabase;
	const { user } = await locals.safeGetSession();

	const [{ data: featured }, { data: trending }, { data: categories }, likedIds] = await Promise.all([
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
		getLikedProjectIds(supabase, user?.id)
	]);

	return {
		featured: featured ?? [],
		trending: trending ?? [],
		categories: categories ?? [],
		likedIds
	};
};
