import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, params }) => {
	const { user } = await locals.safeGetSession();
	if (!user) return json({ error: '로그인이 필요합니다.' }, { status: 401 });

	const projectId = params.projectId;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const sb = locals.supabase as any;

	// 이미 찜했는지 확인
	const { data: existing } = await sb
		.from('project_likes')
		.select('project_id')
		.eq('project_id', projectId)
		.eq('user_id', user.id)
		.maybeSingle();

	if (existing) {
		// 찜 해제
		await sb
			.from('project_likes')
			.delete()
			.eq('project_id', projectId)
			.eq('user_id', user.id);
		return json({ liked: false });
	} else {
		// 찜 추가
		await sb
			.from('project_likes')
			.insert({ project_id: projectId, user_id: user.id });
		return json({ liked: true });
	}
};
