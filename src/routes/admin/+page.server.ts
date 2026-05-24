import { fail } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { getEnv } from '$lib/supabase/env';
import type { PageServerLoad, Actions } from './$types';

// ────────────────────────────────────────────────────────────
// 접근 판단 헬퍼
// ────────────────────────────────────────────────────────────
async function resolveAccess(locals: App.Locals, cookies: { get(name: string): string | undefined }, adminPassword: string) {
	const { user } = await locals.safeGetSession();

	// 구글 로그인 + is_admin = true → 최고 권한
	let isAdmin = false;
	if (user) {
		const { data } = await locals.supabase
			.from('profiles')
			.select('is_admin')
			.eq('id', user.id)
			.single();
		isAdmin = !!data?.is_admin;
	}

	// 비밀번호 쿠키로 잠금 해제됐는지 확인
	const passwordUnlocked = cookies.get('admin_pw') === adminPassword;

	return { user, isAdmin, passwordUnlocked, canAccess: isAdmin || passwordUnlocked };
}

// ────────────────────────────────────────────────────────────
// Load
// ────────────────────────────────────────────────────────────
export const load: PageServerLoad = async ({ locals, cookies, platform }) => {
	const { ADMIN_PASSWORD } = getEnv(platform);
	const { user, isAdmin, passwordUnlocked, canAccess } = await resolveAccess(locals, cookies, ADMIN_PASSWORD);

	if (!canAccess) {
		// 로그인 상태 정도만 전달 (비밀번호 폼 표시용)
		return { needsAuth: true as const, isLoggedIn: !!user, isAdmin: false, pending: [], recent: [], userEmail: null };
	}

	// 심사 대기 프로젝트
	const [pendingRes, recentRes] = await Promise.all([
		locals.supabase
			.from('projects')
			.select(`
				id, slug, title, subtitle, thumbnail_url,
				goal_amount, created_at, tags,
				profiles!projects_creator_id_fkey ( display_name, avatar_url ),
				categories ( name, slug )
			`)
			.eq('status', 'pending_review')
			.order('created_at', { ascending: true }),

		locals.supabase
			.from('projects')
			.select('id, slug, title, status, updated_at, profiles!projects_creator_id_fkey ( display_name )')
			.in('status', ['active', 'draft', 'failed', 'cancelled'])
			.order('updated_at', { ascending: false })
			.limit(20)
	]);

	return {
		needsAuth:       false as const,
		isAdmin,
		passwordUnlocked,           // true = 비밀번호로만 입장 → 관리자 등록 버튼 표시
		isLoggedIn:      !!user,
		userEmail:       user?.email ?? null,
		pending:         pendingRes.data ?? [],
		recent:          recentRes.data  ?? []
	};
};

// ────────────────────────────────────────────────────────────
// Actions
// ────────────────────────────────────────────────────────────
export const actions: Actions = {

	/** 비밀번호로 잠금 해제 */
	unlock: async ({ request, cookies, platform }) => {
		const { ADMIN_PASSWORD } = getEnv(platform);
		const form = await request.formData();
		const pw   = (form.get('password') as string ?? '').trim();

		if (pw !== ADMIN_PASSWORD) {
			return fail(401, { wrongPassword: true });
		}

		cookies.set('admin_pw', pw, {
			path:     '/admin',
			httpOnly: true,
			secure:   !dev,
			sameSite: 'lax',
			maxAge:   60 * 60 * 24
		});

		return { unlocked: true };
	},

	/** 현재 로그인된 구글 계정을 관리자로 등록 */
	registerAdmin: async ({ locals, cookies, platform }) => {
		const { ADMIN_PASSWORD } = getEnv(platform);
		// 비밀번호 쿠키 재확인
		if (cookies.get('admin_pw') !== ADMIN_PASSWORD) {
			return fail(403, { message: '비밀번호 인증이 만료됐습니다. 다시 입력해주세요.' });
		}

		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: '구글 로그인이 필요합니다.' });

		const { error } = await locals.supabase
			.from('profiles')
			.update({ is_admin: true })
			.eq('id', user.id);

		if (error) return fail(500, { message: error.message });

		// 쿠키 삭제 (이제 is_admin으로 접근하므로 불필요)
		cookies.delete('admin_pw', { path: '/admin' });

		return { registered: true };
	},

	/** 프로젝트 승인: pending_review → active */
	approve: async ({ request, locals, cookies, platform }) => {
		const { ADMIN_PASSWORD } = getEnv(platform);
		const { canAccess } = await resolveAccess(locals, cookies, ADMIN_PASSWORD);
		if (!canAccess) return fail(403, { message: '권한 없음' });

		const form = await request.formData();
		const id   = form.get('id') as string;
		if (!id) return fail(400, { message: '프로젝트 ID 없음' });

		const { error } = await locals.supabase
			.from('projects')
			.update({ status: 'active', starts_at: new Date().toISOString() })
			.eq('id', id)
			.eq('status', 'pending_review');

		if (error) return fail(500, { message: error.message });
		return { success: true, action: 'approve' };
	},

	/** 프로젝트 반려: pending_review → draft */
	reject: async ({ request, locals, cookies, platform }) => {
		const { ADMIN_PASSWORD } = getEnv(platform);
		const { canAccess } = await resolveAccess(locals, cookies, ADMIN_PASSWORD);
		if (!canAccess) return fail(403, { message: '권한 없음' });

		const form   = await request.formData();
		const id     = form.get('id')     as string;
		const reason = (form.get('reason') as string | null) ?? '';
		if (!id) return fail(400, { message: '프로젝트 ID 없음' });

		const { error } = await locals.supabase
			.from('projects')
			.update({ status: 'draft' })
			.eq('id', id)
			.eq('status', 'pending_review');

		if (error) return fail(500, { message: error.message });

		// TODO: 반려 사유 창작자에게 알림 (이메일/인앱)
		console.log(`[admin] rejected project=${id} reason="${reason}"`);
		return { success: true, action: 'reject' };
	}
};
