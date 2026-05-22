/**
 * 개발용 단축 로그인 — 이메일 "1" / 비밀번호 "1" 입력 시 호출
 * 테스트 계정을 자동 생성(없으면)하고 실제 자격증명을 반환
 */
import { json, error } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/dynamic/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const DEV_EMAIL = 'dev@keunsabiz.kr';
const DEV_PASS  = 'DevTest1234!';

export const POST: RequestHandler = async () => {
	// 서비스 롤 클라이언트 (서버 전용, 절대 클라이언트에 노출 금지)
	const admin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
		auth: { autoRefreshToken: false, persistSession: false }
	});

	// 테스트 계정 생성 시도 (이미 있으면 에러 무시)
	const { error: createErr } = await admin.auth.admin.createUser({
		email:         DEV_EMAIL,
		password:      DEV_PASS,
		email_confirm: true,
		user_metadata: {
			full_name:    '테스트 계정',
			display_name: '테스트',
		}
	});

	// 이미 존재하는 경우(23505 / "already registered")는 OK
	if (createErr && !createErr.message.includes('already')) {
		console.error('[dev-login] createUser error:', createErr.message);
		throw error(500, '테스트 계정 생성 실패: ' + createErr.message);
	}

	return json({ email: DEV_EMAIL, password: DEV_PASS });
};
