// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

// 이미지 파일 import 타입 선언
declare module '*.png' { const src: string; export default src; }
declare module '*.jpg' { const src: string; export default src; }
declare module '*.jpeg' { const src: string; export default src; }
declare module '*.webp' { const src: string; export default src; }
declare module '*.svg' { const src: string; export default src; }
declare global {
	namespace App {
		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties
		}

		// interface Error {}
		interface Locals {
			supabase: import('@supabase/supabase-js').SupabaseClient<import('$lib/supabase/types').Database>;
			safeGetSession: () => Promise<{
				session: import('@supabase/supabase-js').Session | null;
				user: import('@supabase/supabase-js').User | null;
			}>;
		}
		interface PageData {
			session: import('@supabase/supabase-js').Session | null;
			user: import('@supabase/supabase-js').User | null;
		}
		// interface PageState {}
	}
}

export {};
