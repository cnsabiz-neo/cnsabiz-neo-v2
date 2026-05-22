import { createServerSupabaseClient } from '$lib/supabase/server';
import { getEnv } from '$lib/supabase/env';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const env = getEnv(event.platform);
	event.locals.supabase = createServerSupabaseClient(event, env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY);

	event.locals.safeGetSession = async () => {
		const { data: { session } } = await event.locals.supabase.auth.getSession();
		if (!session) return { session: null, user: null };

		const { data: { user }, error } = await event.locals.supabase.auth.getUser();
		if (error) return { session: null, user: null };

		return { session, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders: (name) => name === 'content-range' || name === 'x-supabase-api-version'
	});
};
