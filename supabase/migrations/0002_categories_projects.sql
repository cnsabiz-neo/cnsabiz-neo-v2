-- 카테고리
create table public.categories (
  id         serial primary key,
  name       text not null,
  name_en    text not null,
  slug       text not null unique,
  icon_url   text,
  sort_order int not null default 0
);

-- 카테고리 초기 데이터
insert into public.categories (name, name_en, slug, sort_order) values
  ('테크/가전', 'tech', 'tech', 1),
  ('패션/잡화', 'fashion', 'fashion', 2),
  ('푸드', 'food', 'food', 3),
  ('홈/리빙', 'home', 'home', 4),
  ('스포츠/레저', 'sports', 'sports', 5),
  ('반려동물', 'pet', 'pet', 6),
  ('뷰티', 'beauty', 'beauty', 7),
  ('디지털 콘텐츠', 'digital', 'digital', 8),
  ('사회/환경', 'social', 'social', 9),
  ('교육', 'education', 'education', 10);

-- 프로젝트 상태 ENUM
create type project_status as enum ('draft', 'pending_review', 'active', 'funded', 'failed', 'cancelled');

-- 프로젝트 테이블
create table public.projects (
  id              uuid primary key default gen_random_uuid(),
  creator_id      uuid not null references public.profiles(id) on delete cascade,
  category_id     int references public.categories(id) on delete set null,
  slug            text not null unique,
  title           text not null,
  subtitle        text,
  thumbnail_url   text,
  story_html      text,
  goal_amount     bigint not null,
  current_amount  bigint not null default 0,
  backer_count    int not null default 0,
  status          project_status not null default 'draft',
  starts_at       timestamptz,
  ends_at         timestamptz,
  is_featured     boolean not null default false,
  tags            text[] not null default '{}',
  view_count      int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index on public.projects (status);
create index on public.projects (category_id);
create index on public.projects (ends_at);
create index on public.projects (creator_id);
create index on public.projects using gin (to_tsvector('simple', title || ' ' || coalesce(subtitle, '')));

create trigger set_projects_updated_at
  before update on public.projects
  for each row execute procedure public.set_updated_at();
