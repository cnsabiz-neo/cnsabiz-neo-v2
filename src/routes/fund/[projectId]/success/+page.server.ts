import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { TxStatus } from '$lib/supabase/types';

/** 계좌이체 메타 (payments.transfer_meta 에 저장) */
interface TransferMeta {
	depositorName?: string | null;
	bank?: string;
	account?: string;
	holder?: string;
	deadline?: string | null;
}

/** payments + 중첩 조인 결과 타입 */
interface PaymentResult {
	order_id: string;
	amount: number;
	status: TxStatus;
	transfer_meta: TransferMeta | null;
	fundings: {
		project_id: string;
		quantity: number;
		rewards: { title: string } | null;
		projects: { slug: string; title: string } | null;
	} | null;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) throw redirect(303, '/auth/login');

	const orderId = url.searchParams.get('orderId');
	if (!orderId) throw error(400, '잘못된 접근입니다.');

	/** 주문 정보 조회 */
	const { data: rawPayment } = await locals.supabase
		.from('payments')
		.select(`
			order_id,
			amount,
			status,
			transfer_meta,
			fundings (
				project_id,
				quantity,
				rewards ( title ),
				projects ( slug, title )
			)
		`)
		.eq('order_id', orderId)
		.single();

	const payment = rawPayment as unknown as PaymentResult | null;
	if (!payment) throw error(404, '주문 정보를 찾을 수 없습니다.');

	const funding = payment.fundings;
	const project = funding?.projects;
	const reward  = funding?.rewards;
	const meta    = payment.transfer_meta ?? {};

	return {
		orderId:       payment.order_id,
		amount:        payment.amount,
		status:        payment.status,
		depositorName: meta.depositorName ?? null,
		bankAccount: {
			bank:     meta.bank ?? '',
			account:  meta.account ?? '',
			holder:   meta.holder ?? '',
			deadline: meta.deadline ?? null
		},
		projectSlug:  project?.slug  ?? null,
		projectTitle: project?.title ?? null,
		rewardTitle:  reward?.title  ?? null
	};
};
