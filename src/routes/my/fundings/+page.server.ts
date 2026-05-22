import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { Database } from '$lib/supabase/types';

type FundingRow = Database['public']['Tables']['fundings']['Row'];

export interface FundingWithJoins extends FundingRow {
	projects: { title: string; slug: string; thumbnail_url: string | null } | null;
	rewards: { title: string; amount: number } | null;
}

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) throw redirect(303, '/auth/login?next=/my/fundings');

	const { data } = await locals.supabase
		.from('fundings')
		.select('*, projects(title, slug, thumbnail_url), rewards(title, amount)')
		.eq('backer_id', user.id)
		.order('created_at', { ascending: false });

	return { fundings: (data ?? []) as unknown as FundingWithJoins[] };
};
