import type { LayoutServerLoad } from './$types';

// 인증 체크는 +page.server.ts 에서 처리
// (비밀번호 게이트 vs is_admin 분기가 페이지 레벨에서 필요)
export const load: LayoutServerLoad = async () => ({});
