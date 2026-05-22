import { createServerClient } from '@supabase/ssr';
import type { Database } from './types';
import type { RequestEvent } from '@sveltejs/kit';

export function createServerSupabaseClient(event: RequestEvent, url: string, key: string) {
	return createServerClient<Database>(url, key, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookies) => {
				cookies.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});
}
