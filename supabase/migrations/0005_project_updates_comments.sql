-- 프로젝트 업데이트
create table public.project_updates (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  author_id    uuid not null references public.profiles(id) on delete cascade,
  title        text not null,
  content_html text not null,
  is_public    boolean not null default true,
  created_at   timestamptz not null default now()
);

create index on public.project_updates (project_id);

-- 댓글 (threaded)
create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  parent_id   uuid references public.comments(id) on delete cascade,
  content     text not null,
  is_deleted  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index on public.comments (project_id);
create index on public.comments (parent_id);

create trigger set_comments_updated_at
  before update on public.comments
  for each row execute procedure public.set_updated_at();
