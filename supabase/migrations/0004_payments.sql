-- 결제 테이블
create table public.payments (
  id             uuid primary key default gen_random_uuid(),
  funding_id     uuid not null references public.fundings(id) on delete cascade,
  order_id       text not null unique,
  payment_key    text,
  amount         bigint not null,
  method         text,
  status         text not null default 'pending' check (status in ('pending', 'done', 'cancelled', 'aborted', 'partial_cancelled')),
  toss_response  jsonb,
  approved_at    timestamptz,
  created_at     timestamptz not null default now()
);

create index on public.payments (funding_id);
create index on public.payments (order_id);

-- 결제 확인 RPC (Edge Function에서 호출, 원자적 트랜잭션)
create or replace function public.confirm_payment(
  p_order_id      text,
  p_payment_key   text,
  p_method        text,
  p_toss_response jsonb
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_payment   public.payments%rowtype;
begin
  -- 행 잠금 (이중 결제 방지)
  select * into v_payment from public.payments
  where order_id = p_order_id for update;

  if not found then
    raise exception 'Payment not found: %', p_order_id;
  end if;

  if v_payment.status != 'pending' then
    raise exception 'Payment already processed: %', v_payment.status;
  end if;

  -- payments 업데이트
  update public.payments
  set payment_key   = p_payment_key,
      method        = p_method,
      status        = 'done',
      toss_response = p_toss_response,
      approved_at   = now()
  where order_id = p_order_id;

  -- fundings 상태 업데이트 (트리거가 project_stats 갱신)
  update public.fundings
  set status = 'paid'
  where id = v_payment.funding_id;
end;
$$;
