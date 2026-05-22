import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const supabase = locals.supabase;

	const [{ data: featured }, { data: trending }, { data: categories }] = await Promise.all([
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

		supabase.from('categories').select('*').order('sort_order')
	]);

	return {
		featured: featured ?? [],
		trending: trending ?? [],
		categories: categories ?? []
	};
};
