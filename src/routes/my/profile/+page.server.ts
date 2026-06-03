import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) throw redirect(303, '/auth/login?next=/my/profile');

	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('display_name, bio, avatar_url, username, is_creator, is_admin')
		.eq('id', user.id)
		.maybeSingle();

	return {
		email: user.email ?? '',
		profile: profile ?? {
			display_name: null,
			bio: null,
			avatar_url: null,
			username: null,
			is_creator: false,
			is_admin: false
		}
	};
};

export const actions: Actions = {
	save: async ({ locals, request }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { error: '로그인이 필요합니다.' });

		const fd = await request.formData();
		const displayName = (fd.get('display_name') as string ?? '').trim();
		const bio         = (fd.get('bio')          as string ?? '').trim();
		const avatarUrl   = (fd.get('avatar_url')   as string ?? '').trim();

		if (!displayName) return fail(400, { error: '닉네임을 입력해주세요.' });
		if (displayName.length > 20) return fail(400, { error: '닉네임은 20자 이내로 입력해주세요.' });
		if (bio.length > 200) return fail(400, { error: '소개는 200자 이내로 입력해주세요.' });

		const { error } = await locals.supabase
			.from('profiles')
			.update({
				display_name: displayName,
				bio:          bio || null,
				avatar_url:   avatarUrl || null
			})
			.eq('id', user.id);

		if (error) {
			console.error('[profile] 저장 실패:', error.message, error.code);
			return fail(500, { error: '프로필 저장에 실패했습니다.' });
		}

		return { success: true };
	}
};
