import { createClient } from '@supabase/supabase-js';
import { getEnv } from '$lib/supabase/env';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { MarketItem } from '$lib/supabase/market';

const PAGE_SIZE = 20;

function serviceClient(url: string, key: string) {
	return createClient(url, key);
}
function anonClient(url: string, key: string) {
	return createClient(url, key);
}

export const load: PageServerLoad = async ({ url, platform }) => {
	const { PUBLIC_MARKET_SUPABASE_URL, PUBLIC_MARKET_SUPABASE_ANON_KEY } = getEnv(platform);
	const db = anonClient(PUBLIC_MARKET_SUPABASE_URL, PUBLIC_MARKET_SUPABASE_ANON_KEY);
	const page      = Math.max(1, Number(url.searchParams.get('page')   ?? 1));
	const domain    = Number(url.searchParams.get('domain')  ?? 0);
	const classNum  = Number(url.searchParams.get('class')   ?? 0);
	const groupNum  = Number(url.searchParams.get('group')   ?? 0);
	const q         = url.searchParams.get('q') ?? '';
	const onlyAvail = url.searchParams.get('avail') === '1';

	const from = (page - 1) * PAGE_SIZE;
	const to   = from + PAGE_SIZE - 1;

	let query = db
		.from('items')
		.select('*', { count: 'exact' })
		.order('created_at', { ascending: false });

	if (domain)    query = query.eq('domain',    domain);
	if (classNum)  query = query.eq('class_num', classNum);
	if (groupNum)  query = query.eq('group_num', groupNum);
	if (q.trim())  query = query.ilike('title',  `%${q.trim()}%`);
	if (onlyAvail) query = query.eq('is_completed', false)
	                             .eq('status',       false)
	                             .eq('is_reserved',  false);

	query = query.range(from, to);

	const { data, count, error } = await query;

	if (error) console.error('[market] load 오류:', error.message);

	return {
		items:    (data ?? []) as MarketItem[],
		total:    count ?? 0,
		page,
		pageSize: PAGE_SIZE,
		filters:  { domain, classNum, groupNum, q, onlyAvail },
	};
};

function isCnsaEmail(email: string | null | undefined) {
	return !!email && email.endsWith('@cnsa.hs.kr');
}

export const actions: Actions = {
	reserve: async ({ request, locals, platform }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { error: '로그인이 필요합니다.' });
		if (!isCnsaEmail(user.email))
			return fail(403, { error: '충남삼성고(@cnsa.hs.kr) 계정만 거래할 수 있습니다.' });

		const itemId = (await request.formData()).get('itemId') as string;
		if (!itemId) return fail(400, { error: '잘못된 요청입니다.' });

		const { PUBLIC_MARKET_SUPABASE_URL, MARKET_SUPABASE_SERVICE_KEY } = getEnv(platform);
		const db = serviceClient(PUBLIC_MARKET_SUPABASE_URL, MARKET_SUPABASE_SERVICE_KEY);
		const { data: item } = await db
			.from('items').select('is_reserved,is_completed,status,uploaded_by').eq('id', itemId).single();

		if (!item)                        return fail(404, { error: '상품을 찾을 수 없습니다.' });
		if (item.is_completed || item.status) return fail(409, { error: '이미 거래 완료된 상품입니다.' });
		if (item.is_reserved)             return fail(409, { error: '이미 예약된 상품입니다.' });
		if (item.uploaded_by === user.email) return fail(400, { error: '본인 상품은 예약할 수 없습니다.' });

		const { error } = await db.from('items')
			.update({ is_reserved: true, reserved_by: user.email }).eq('id', itemId);
		if (error) return fail(500, { error: '예약 처리 중 오류가 발생했습니다.' });
		return { success: true, action: 'reserve' };
	},

	cancelReserve: async ({ request, locals, platform }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { error: '로그인이 필요합니다.' });

		const itemId = (await request.formData()).get('itemId') as string;
		const { PUBLIC_MARKET_SUPABASE_URL, MARKET_SUPABASE_SERVICE_KEY } = getEnv(platform);
		const db = serviceClient(PUBLIC_MARKET_SUPABASE_URL, MARKET_SUPABASE_SERVICE_KEY);
		const { data: item } = await db
			.from('items').select('reserved_by,uploaded_by,is_completed').eq('id', itemId).single();

		if (!item)         return fail(404, { error: '상품을 찾을 수 없습니다.' });
		if (item.is_completed) return fail(409, { error: '거래 완료된 상품입니다.' });
		if (item.reserved_by !== user.email && item.uploaded_by !== user.email)
			return fail(403, { error: '예약 취소 권한이 없습니다.' });

		const { error } = await db.from('items')
			.update({ is_reserved: false, reserved_by: null }).eq('id', itemId);
		if (error) return fail(500, { error: '취소 처리 중 오류가 발생했습니다.' });
		return { success: true, action: 'cancelReserve' };
	},

	complete: async ({ request, locals, platform }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { error: '로그인이 필요합니다.' });

		const itemId = (await request.formData()).get('itemId') as string;
		const { PUBLIC_MARKET_SUPABASE_URL, MARKET_SUPABASE_SERVICE_KEY } = getEnv(platform);
		const db = serviceClient(PUBLIC_MARKET_SUPABASE_URL, MARKET_SUPABASE_SERVICE_KEY);
		const { data: item } = await db
			.from('items').select('uploaded_by,is_completed').eq('id', itemId).single();

		if (!item)         return fail(404, { error: '상품을 찾을 수 없습니다.' });
		if (item.is_completed) return fail(409, { error: '이미 완료된 거래입니다.' });
		if (item.uploaded_by !== user.email)
			return fail(403, { error: '판매자만 거래 완료 처리할 수 있습니다.' });

		const { error } = await db.from('items')
			.update({ is_completed: true, status: true }).eq('id', itemId);
		if (error) return fail(500, { error: '거래 완료 처리 중 오류가 발생했습니다.' });
		return { success: true, action: 'complete' };
	},
};
