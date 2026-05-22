import { getEnv } from '$lib/supabase/env';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
	const { session, user } = await locals.safeGetSession();
	const env = getEnv(platform);
	return {
		session,
		user,
		supabaseUrl:     env.PUBLIC_SUPABASE_URL,
		supabaseAnonKey: env.PUBLIC_SUPABASE_ANON_KEY
	};
};
