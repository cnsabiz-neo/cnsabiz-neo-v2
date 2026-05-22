/**
 * Cloudflare Pages 런타임(platform.env) + 로컬 개발(process.env) 통합 env 헬퍼
 * $env/* 임포트를 완전히 대체 — 빌드 시점 env 검증 없음
 */
export interface AppEnv {
	PUBLIC_SUPABASE_URL:        string;
	PUBLIC_SUPABASE_ANON_KEY:   string;
	SUPABASE_SERVICE_ROLE_KEY:  string;
	ADMIN_PASSWORD:             string;
	PUBLIC_MARKET_SUPABASE_URL:      string;
	PUBLIC_MARKET_SUPABASE_ANON_KEY: string;
	MARKET_SUPABASE_SERVICE_KEY:     string;
}

export function getEnv(platform?: App.Platform | null): AppEnv {
	// Cloudflare Pages 런타임 — platform.env
	const cf = platform?.env as Record<string, string> | undefined;
	// 로컬 개발 — process.env (Node.js)
	const pe: Record<string, string | undefined> =
		typeof process !== 'undefined' ? (process.env as Record<string, string | undefined>) : {};

	const pick = (key: string) => cf?.[key] ?? pe[key] ?? '';

	return {
		PUBLIC_SUPABASE_URL:             pick('PUBLIC_SUPABASE_URL'),
		PUBLIC_SUPABASE_ANON_KEY:        pick('PUBLIC_SUPABASE_ANON_KEY'),
		SUPABASE_SERVICE_ROLE_KEY:       pick('SUPABASE_SERVICE_ROLE_KEY'),
		ADMIN_PASSWORD:                  pick('ADMIN_PASSWORD'),
		PUBLIC_MARKET_SUPABASE_URL:      pick('PUBLIC_MARKET_SUPABASE_URL'),
		PUBLIC_MARKET_SUPABASE_ANON_KEY: pick('PUBLIC_MARKET_SUPABASE_ANON_KEY'),
		MARKET_SUPABASE_SERVICE_KEY:     pick('MARKET_SUPABASE_SERVICE_KEY'),
	};
}
