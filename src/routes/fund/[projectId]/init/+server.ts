import { json, error } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import type { RequestHandler } from './$types';
import type { Database } from '$lib/supabase/types';

type ProjectRow = Database['public']['Tables']['projects']['Row'];
type RewardRow  = Database['public']['Tables']['rewards']['Row'];

/** 입금 계좌 정보 — 환경변수 또는 여기서 직접 설정 */
export const BANK_ACCOUNT = {
	bank:    '신한은행',
	account: '110-123-456789',
	holder:  '큰사비즈(충남삼성고)',
	deadlineHours: 24          // 이체 마감 시간
} as const;

export const POST: RequestHandler = async ({ locals, params, request }) => {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) throw error(401, '로그인이 필요합니다.');

	const body = await request.json() as {
		rewardId?: string;
		quantity?: number;
		depositorName?: string;
	};
	const { rewardId, quantity = 1, depositorName = '' } = body;

	if (!rewardId)          throw error(400, '리워드를 선택해주세요.');
	if (!depositorName.trim()) throw error(400, '입금자명을 입력해주세요.');

	const supabase = locals.supabase;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const sb = supabase as any;

	/** 프로젝트 검증 */
	const { data: rawProject } = await supabase
		.from('projects')
		.select('id, title, status, ends_at')
		.eq('id', params.projectId)
		.eq('status', 'active')
		.single();

	const project = rawProject as Pick<ProjectRow, 'id' | 'title' | 'status' | 'ends_at'> | null;
	if (!project) throw error(404, '진행 중인 프로젝트가 아닙니다.');
	if (project.ends_at && new Date(project.ends_at) < new Date()) {
		throw error(400, '마감된 프로젝트입니다.');
	}

	/** 리워드 검증 */
	const { data: rawReward } = await supabase
		.from('rewards')
		.select('amount, max_quantity, claimed_count, title')
		.eq('id', rewardId)
		.eq('project_id', params.projectId)
		.single();

	const reward = rawReward as Pick<RewardRow, 'amount' | 'max_quantity' | 'claimed_count' | 'title'> | null;
	if (!reward) throw error(404, '리워드를 찾을 수 없습니다.');
	if (reward.max_quantity !== null && reward.claimed_count + quantity > reward.max_quantity) {
		throw error(400, '선택 가능한 수량을 초과했습니다.');
	}

	const amount  = reward.amount * quantity;
	const orderId = nanoid(22);

	/** 이체 마감 시각 계산 */
	const deadline = new Date(Date.now() + BANK_ACCOUNT.deadlineHours * 60 * 60 * 1000).toISOString();

	/** fundings 레코드 생성 (pending) */
	const { data: funding, error: fundingErr } = await sb
		.from('fundings')
		.insert({
			project_id: params.projectId,
			backer_id:  user.id,
			reward_id:  rewardId,
			amount,
			quantity,
			status: 'pending'
		})
		.select('id')
		.single();

	if (fundingErr || !funding) throw error(500, '후원 신청에 실패했습니다.');

	/** payments 레코드 생성 — 계좌이체 메타는 transfer_meta 에 저장 */
	await sb.from('payments').insert({
		funding_id:    (funding as { id: string }).id,
		order_id:      orderId,
		amount,
		method:        'bank_transfer',
		status:        'pending',
		transfer_meta: {
			depositorName: depositorName.trim(),
			bank:          BANK_ACCOUNT.bank,
			account:       BANK_ACCOUNT.account,
			holder:        BANK_ACCOUNT.holder,
			deadline
		}
	});

	return json({
		orderId,
		amount,
		depositorName: depositorName.trim(),
		bankAccount: {
			bank:     BANK_ACCOUNT.bank,
			account:  BANK_ACCOUNT.account,
			holder:   BANK_ACCOUNT.holder,
			deadline
		}
	});
};
