-- RLS 활성화
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.projects enable row level security;
alter table public.rewards enable row level security;
alter table public.fundings enable row level security;
alter table public.payments enable row level security;
alter table public.project_updates enable row level security;
alter table public.comments enable row level security;

-- profiles
create policy "profiles_read_all" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- categories
create policy "categories_read_all" on public.categories for select using (true);

-- projects
create policy "projects_read_public" on public.projects for select
  using (status in ('active', 'funded', 'failed'));
create policy "projects_read_own" on public.projects for select
  using (auth.uid() = creator_id);
create policy "projects_insert_own" on public.projects for insert
  with check (auth.uid() = creator_id);
create policy "projects_update_own" on public.projects for update
  using (auth.uid() = creator_id);

-- rewards
create policy "rewards_read_public" on public.rewards for select
  using (exists (
    select 1 from public.projects p
    where p.id = project_id and p.status in ('active', 'funded', 'failed')
  ));
create policy "rewards_manage_own" on public.rewards for all
  using (exists (
    select 1 from public.projects p
    where p.id = project_id and p.creator_id = auth.uid()
  ));

-- fundings
create policy "fundings_read_own_backer" on public.fundings for select
  using (auth.uid() = backer_id);
create policy "fundings_read_own_creator" on public.fundings for select
  using (exists (
    select 1 from public.projects p
    where p.id = project_id and p.creator_id = auth.uid()
  ));
create policy "fundings_insert_own" on public.fundings for insert
  with check (auth.uid() = backer_id);

-- payments (service_role only for insert/update; users read their own)
create policy "payments_read_own" on public.payments for select
  using (exists (
    select 1 from public.fundings f
    where f.id = funding_id and f.backer_id = auth.uid()
  ));

-- project_updates
create policy "updates_read_public" on public.project_updates for select
  using (is_public = true);
create policy "updates_read_backer" on public.project_updates for select
  using (
    is_public = false and
    exists (
      select 1 from public.fundings f
      where f.project_id = project_id and f.backer_id = auth.uid() and f.status = 'paid'
    )
  );
create policy "updates_manage_own" on public.project_updates for all
  using (auth.uid() = author_id);

-- comments
create policy "comments_read_all" on public.comments for select
  using (is_deleted = false);
create policy "comments_insert_auth" on public.comments for insert
  with check (auth.uid() = author_id);
create policy "comments_update_own" on public.comments for update
  using (auth.uid() = author_id);
