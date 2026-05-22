import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const supabase = locals.supabase;
	const { user } = await locals.safeGetSession();
	const category = url.searchParams.get('category');
	const q = url.searchParams.get('q');
	const sort = url.searchParams.get('sort') ?? 'popular';

	const [{ data: categories }, projectsResult, { data: likes }] = await Promise.all([
		supabase.from('categories').select('*').order('sort_order'),
		(async () => {
			let query = supabase
				.from('projects')
				.select('*, profiles(display_name, avatar_url), categories(name, slug)')
				.in('status', ['active', 'funded']);

			if (category) query = query.eq('categories.slug', category);
			if (q) query = query.ilike('title', `%${q}%`);

			if (sort === 'popular') query = query.order('backer_count', { ascending: false });
			else if (sort === 'new') query = query.order('created_at', { ascending: false });
			else if (sort === 'ending') query = query.order('ends_at', { ascending: true });

			return query.limit(24);
		})(),

		// 로그인한 사용자의 찜 목록
		user
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			? (supabase as any).from('project_likes').select('project_id').eq('user_id', user.id)
			: Promise.resolve({ data: [] })
	]);

	const likedIds = new Set<string>((likes ?? []).map((l: { project_id: string }) => l.project_id));

	return {
		categories: categories ?? [],
		projects: projectsResult.data ?? [],
		activeCategory: category,
		query: q,
		sort,
		likedIds: [...likedIds]
	};
};
