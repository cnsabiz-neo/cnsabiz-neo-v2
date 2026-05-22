import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) throw redirect(303, '/auth/login');

	const orderId = url.searchParams.get('orderId');
	if (!orderId) throw error(400, '잘못된 접근입니다.');

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const sb = locals.supabase as any;

	/** 주문 정보 조회 */
	const { data: payment } = await sb
		.from('payments')
		.select(`
			order_id,
			amount,
			status,
			toss_response,
			fundings (
				project_id,
				quantity,
				rewards ( title ),
				projects ( slug, title )
			)
		`)
		.eq('order_id', orderId)
		.single();

	if (!payment) throw error(404, '주문 정보를 찾을 수 없습니다.');

	const funding   = (payment as any).fundings;
	const project   = funding?.projects;
	const reward    = funding?.rewards;
	const meta      = (payment as any).transfer_meta ?? {};

	return {
		orderId:       (payment as any).order_id   as string,
		amount:        (payment as any).amount      as number,
		status:        (payment as any).status      as string,
		depositorName: meta.depositorName           as string | null,
		bankAccount: {
			bank:     meta.bank     as string,
			account:  meta.account  as string,
			holder:   meta.holder   as string,
			deadline: meta.deadline as string | null
		},
		projectSlug:  project?.slug  ?? null,
		projectTitle: project?.title ?? null,
		rewardTitle:  reward?.title  ?? null
	};
};
