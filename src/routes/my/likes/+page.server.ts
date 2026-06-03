import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getLikedProjectIds } from '$lib/supabase/likes';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) throw redirect(303, '/auth/login?next=/my/likes');

	const likedIds = await getLikedProjectIds(locals.supabase, user.id);

	if (likedIds.length === 0) {
		return { projects: [], likedIds: [] };
	}

	const { data: projects } = await locals.supabase
		.from('projects')
		.select('*, profiles!projects_creator_id_fkey(display_name, avatar_url), categories(name)')
		.in('id', likedIds)
		.order('created_at', { ascending: false });

	return {
		projects: projects ?? [],
		likedIds
	};
};
