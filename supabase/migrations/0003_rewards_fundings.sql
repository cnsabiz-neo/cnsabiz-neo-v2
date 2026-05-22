-- 리워드 테이블
create table public.rewards (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references public.projects(id) on delete cascade,
  title               text not null,
  description         text,
  amount              bigint not null,
  max_quantity        int,
  claimed_count       int not null default 0,
  estimated_delivery  date,
  is_early_bird       boolean not null default false,
  sort_order          int not null default 0,
  created_at          timestamptz not null default now()
);

create index on public.rewards (project_id);

-- 펀딩 테이블
create table public.fundings (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  backer_id   uuid not null references public.profiles(id) on delete cascade,
  reward_id   uuid references public.rewards(id) on delete set null,
  amount      bigint not null,
  quantity    int not null default 1,
  status      text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'refunded')),
  anonymous   boolean not null default false,
  message     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index on public.fundings (project_id);
create index on public.fundings (backer_id);
create index on public.fundings (status);

create trigger set_fundings_updated_at
  before update on public.fundings
  for each row execute procedure public.set_updated_at();

-- 결제 완료 시 프로젝트 통계 및 리워드 claimed_count 업데이트
create or replace function public.update_project_stats()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'paid' and (old.status is null or old.status != 'paid') then
    update public.projects
    set current_amount = current_amount + new.amount,
        backer_count = backer_count + 1
    where id = new.project_id;

    if new.reward_id is not null then
      update public.rewards
      set claimed_count = claimed_count + new.quantity
      where id = new.reward_id;
    end if;
  end if;
  return new;
end;
$$;

create trigger on_funding_paid
  after insert or update on public.fundings
  for each row execute procedure public.update_project_stats();
