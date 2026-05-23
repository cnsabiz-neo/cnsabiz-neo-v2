import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * 로그인한 사용자가 찜한 프로젝트 ID 목록을 조회한다.
 * userId 가 없으면(비로그인) 빈 배열을 반환한다.
 */
export async function getLikedProjectIds(
	supabase: SupabaseClient<Database>,
	userId: string | null | undefined
): Promise<string[]> {
	if (!userId) return [];

	const { data } = await supabase
		.from('project_likes')
		.select('project_id')
		.eq('user_id', userId);

	return (data ?? []).map((l) => l.project_id);
}
