import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const { paymentKey, orderId, amount } = await req.json();

		if (!paymentKey || !orderId || !amount) {
			return new Response(JSON.stringify({ message: '필수 파라미터가 없습니다.' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		const supabase = createClient(
			Deno.env.get('SUPABASE_URL')!,
			Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
		);

		// DB에서 결제 금액 확인 (변조 방지)
		const { data: payment, error: paymentErr } = await supabase
			.from('payments')
			.select('amount, status, funding_id')
			.eq('order_id', orderId)
			.single();

		if (paymentErr || !payment) {
			return new Response(JSON.stringify({ message: '결제 정보를 찾을 수 없습니다.' }), {
				status: 404,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		if (payment.status !== 'pending') {
			return new Response(JSON.stringify({ message: '이미 처리된 결제입니다.' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		// 금액 변조 확인
		if (payment.amount !== amount) {
			return new Response(JSON.stringify({ message: '결제 금액이 일치하지 않습니다.' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		// Toss Confirm API 호출
		const tossSecretKey = Deno.env.get('TOSS_SECRET_KEY')!;
		const credentials = btoa(`${tossSecretKey}:`);

		const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
			method: 'POST',
			headers: {
				Authorization: `Basic ${credentials}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ paymentKey, orderId, amount })
		});

		const tossData = await tossRes.json();

		if (!tossRes.ok) {
			return new Response(JSON.stringify({ message: tossData.message ?? 'Toss 결제 확인 실패' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		// 원자적 DB 업데이트
		const { error: rpcError } = await supabase.rpc('confirm_payment', {
			p_order_id: orderId,
			p_payment_key: paymentKey,
			p_method: tossData.method,
			p_toss_response: tossData
		});

		if (rpcError) {
			console.error('confirm_payment RPC error:', rpcError);
			return new Response(JSON.stringify({ message: '결제 확인 처리 중 오류가 발생했습니다.' }), {
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		// 프로젝트 슬러그 조회 (성공 페이지 리디렉션용)
		const { data: funding } = await supabase
			.from('fundings')
			.select('projects(slug)')
			.eq('id', payment.funding_id)
			.single();

		const projectSlug = (funding as any)?.projects?.slug ?? null;

		return new Response(JSON.stringify({ success: true, projectSlug }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	} catch (e) {
		console.error('verify-payment error:', e);
		return new Response(JSON.stringify({ message: '서버 오류가 발생했습니다.' }), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}
});
