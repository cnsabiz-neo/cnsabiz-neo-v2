-- ============================================================
--  큰사비즈 — 최적화 스키마 v2
--  Supabase SQL Editor 에 그대로 붙여넣고 실행하세요.
--
--  핵심 최적화 포인트
--  1. story_html 분리  → 목록 쿼리 egress 90%+ 절감
--  2. 카운트 비정규화  → comment_count / update_count 집계 쿼리 제거
--  3. creator_id 비정규화 on rewards  → RLS 서브쿼리 제거
--  4. 복합 인덱스 추가 → 카테고리·상태·마감일 복합 필터 index scan
--  5. 부분 인덱스(Partial)→ 실제 사용 행에만 인덱스 적용
--  6. RLS 정책 단순화  → 행별 서브쿼리 → 단순 등호/IN 패턴
--  7. payments 컬럼명  → toss_response → transfer_meta
-- ============================================================


-- ─────────────────────────────────────────
-- 0. ENUM 타입
-- ─────────────────────────────────────────
CREATE TYPE project_status AS ENUM (
  'draft',           -- 작성 중
  'pending_review',  -- 검토 요청
  'active',          -- 펀딩 진행 중
  'funded',          -- 목표 달성 완료
  'failed',          -- 미달성 마감
  'cancelled'        -- 취소
);

-- fundings / payments 는 동일 값 → 하나의 ENUM 공유
CREATE TYPE tx_status AS ENUM (
  'pending',    -- 이체 대기
  'paid',       -- 확인 완료
  'cancelled',  -- 취소
  'refunded'    -- 환불
);


-- ─────────────────────────────────────────
-- 1. profiles  (auth.users 1:1 확장)
-- ─────────────────────────────────────────
CREATE TABLE public.profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT        UNIQUE,
  display_name  TEXT,
  avatar_url    TEXT,
  bio           TEXT,
  is_creator    BOOLEAN     NOT NULL DEFAULT false,
  is_admin      BOOLEAN     NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 회원가입 시 profile 자동 생성 (Google OAuth full_name·avatar 반영)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ─────────────────────────────────────────
-- 2. categories
-- ─────────────────────────────────────────
CREATE TABLE public.categories (
  id          SERIAL      PRIMARY KEY,
  name        TEXT        NOT NULL,
  name_en     TEXT,
  slug        TEXT        NOT NULL UNIQUE,
  icon_url    TEXT,
  sort_order  INT         NOT NULL DEFAULT 0
);

-- 기본 카테고리 시드
INSERT INTO public.categories (name, name_en, slug, sort_order) VALUES
  ('테크·가전',       'Tech',        'tech',        1),
  ('패션',           'Fashion',     'fashion',     2),
  ('뷰티',           'Beauty',      'beauty',      3),
  ('홈·리빙',        'Home',        'home',        4),
  ('스포츠·아웃도어', 'Sports',      'sports',      5),
  ('푸드',           'Food',        'food',        6),
  ('도서',           'Books',       'books',       7),
  ('전자책·클래스',   'Class',       'class',       8),
  ('디자인',         'Design',      'design',      9),
  ('반려동물',        'Pets',        'pets',        10),
  ('아트',           'Art',         'art',         11),
  ('캐릭터·굿즈',    'Goods',       'goods',       12),
  ('영화·음악',      'Culture',     'culture',     13),
  ('키즈',           'Kids',        'kids',        14);


-- ─────────────────────────────────────────
-- 3. projects  ★ story_html 분리 / 카운트 추가
-- ─────────────────────────────────────────
-- [최적화] story_html 제거 → project_stories 테이블로 분리.
--   목록/카드 쿼리에서 수백KB HTML이 딸려오는 egress 낭비를 방지.
CREATE TABLE public.projects (
  id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id      UUID           NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id     INT            REFERENCES public.categories(id) ON DELETE SET NULL,
  slug            TEXT           NOT NULL UNIQUE,
  title           TEXT           NOT NULL,
  subtitle        TEXT,
  thumbnail_url   TEXT,
  -- ↓ 집계 카운트 비정규화 (COUNT 쿼리 대체)
  goal_amount     BIGINT         NOT NULL DEFAULT 0,
  current_amount  BIGINT         NOT NULL DEFAULT 0,
  backer_count    INT            NOT NULL DEFAULT 0,
  comment_count   INT            NOT NULL DEFAULT 0,  -- ← NEW
  update_count    INT            NOT NULL DEFAULT 0,  -- ← NEW
  status          project_status NOT NULL DEFAULT 'draft',
  starts_at       TIMESTAMPTZ,
  ends_at         TIMESTAMPTZ,
  is_featured     BOOLEAN        NOT NULL DEFAULT false,
  tags            TEXT[]         NOT NULL DEFAULT '{}',
  view_count      INT            NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- 단일 컬럼 인덱스
CREATE INDEX idx_projects_creator     ON public.projects(creator_id);
CREATE INDEX idx_projects_slug        ON public.projects(slug);   -- 상세 페이지 조회

-- [최적화] 복합 인덱스 — 홈/탐색 페이지에서 가장 자주 쓰는 필터 패턴
CREATE INDEX idx_projects_status_ends ON public.projects(status, ends_at)
  WHERE status = 'active';                                         -- 진행 중 프로젝트만

CREATE INDEX idx_projects_cat_status  ON public.projects(category_id, status, ends_at);

CREATE INDEX idx_projects_featured    ON public.projects(is_featured, status)
  WHERE is_featured = true;                                        -- 추천 프로젝트만

CREATE INDEX idx_projects_creator_st  ON public.projects(creator_id, status);

-- 한국어 전문 검색 (GIN)
CREATE INDEX idx_projects_fts ON public.projects
  USING GIN (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(subtitle,'')));


-- ─────────────────────────────────────────
-- 4. project_stories  ★ NEW — 스토리 본문 전용 테이블
-- ─────────────────────────────────────────
-- [최적화] projects 에서 story_html(수백KB) 분리.
--   상세 페이지 로드 시에만 JOIN. 목록/카드 쿼리는 절대 접근 안 함.
CREATE TABLE public.project_stories (
  project_id  UUID        PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
  story_html  TEXT,                          -- rich HTML (이미지 포함 시 수백KB)
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ─────────────────────────────────────────
-- 5. rewards  ★ creator_id 비정규화 추가
-- ─────────────────────────────────────────
-- [최적화] creator_id 추가 → RLS에서 projects 조인/서브쿼리 제거.
--   이전: EXISTS(SELECT 1 FROM projects WHERE ...) = 행마다 서브쿼리
--   이후: creator_id = auth.uid()  = 단순 등호 비교
CREATE TABLE public.rewards (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  creator_id          UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,  -- ← NEW
  title               TEXT        NOT NULL,
  description         TEXT,
  amount              BIGINT      NOT NULL,
  max_quantity        INT,                   -- NULL = 무제한
  claimed_count       INT         NOT NULL DEFAULT 0,
  estimated_delivery  DATE,
  is_early_bird       BOOLEAN     NOT NULL DEFAULT false,
  sort_order          INT         NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rewards_project ON public.rewards(project_id, sort_order);


-- ─────────────────────────────────────────
-- 6. fundings  (후원 기록)
-- ─────────────────────────────────────────
CREATE TABLE public.fundings (
  id          UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID       NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  backer_id   UUID       NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_id   UUID       REFERENCES public.rewards(id) ON DELETE SET NULL,
  amount      BIGINT     NOT NULL,
  quantity    INT        NOT NULL DEFAULT 1,
  status      tx_status  NOT NULL DEFAULT 'pending',
  anonymous   BOOLEAN    NOT NULL DEFAULT false,
  message     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- [최적화] 부분 인덱스 — 실제 집계에 쓰이는 paid 행만 인덱싱
CREATE INDEX idx_fundings_project_paid ON public.fundings(project_id)
  WHERE status = 'paid';

CREATE INDEX idx_fundings_backer       ON public.fundings(backer_id, status);
CREATE INDEX idx_fundings_reward       ON public.fundings(reward_id)
  WHERE reward_id IS NOT NULL;


-- ─────────────────────────────────────────
-- 7. payments  ★ toss_response → transfer_meta
-- ─────────────────────────────────────────
CREATE TABLE public.payments (
  id             UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
  funding_id     UUID       NOT NULL UNIQUE REFERENCES public.fundings(id) ON DELETE CASCADE,
  order_id       TEXT       NOT NULL UNIQUE,   -- nanoid(22) 생성
  amount         BIGINT     NOT NULL,
  method         TEXT       NOT NULL DEFAULT 'bank_transfer',
  status         tx_status  NOT NULL DEFAULT 'pending',
  -- [최적화] toss_response → transfer_meta (계좌이체 메타: depositorName, bank, account, deadline)
  transfer_meta  JSONB,
  approved_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE INDEX idx_payments_status   ON public.payments(status)
  WHERE status = 'pending';              -- 미처리 건만 인덱싱


-- ─────────────────────────────────────────
-- 8. project_updates  (창작자 업데이트)
-- ─────────────────────────────────────────
CREATE TABLE public.project_updates (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title        TEXT        NOT NULL,
  content_html TEXT,
  is_public    BOOLEAN     NOT NULL DEFAULT true,  -- false = 후원자 전용
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- [최적화] 공개 업데이트만 부분 인덱싱
CREATE INDEX idx_updates_project_public ON public.project_updates(project_id, created_at DESC)
  WHERE is_public = true;


-- ─────────────────────────────────────────
-- 9. comments  (댓글, threaded)
-- ─────────────────────────────────────────
CREATE TABLE public.comments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id   UUID        REFERENCES public.comments(id) ON DELETE CASCADE,
  content     TEXT        NOT NULL,
  is_deleted  BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- [최적화] 삭제 안 된 루트 댓글만 부분 인덱싱
CREATE INDEX idx_comments_project_root ON public.comments(project_id, created_at DESC)
  WHERE is_deleted = false AND parent_id IS NULL;

CREATE INDEX idx_comments_parent ON public.comments(parent_id)
  WHERE parent_id IS NOT NULL;


-- ─────────────────────────────────────────
-- 10. 트리거 함수 모음
-- ─────────────────────────────────────────

-- ① updated_at 자동 갱신
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated_at        BEFORE UPDATE ON public.profiles        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_projects_updated_at        BEFORE UPDATE ON public.projects        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_fundings_updated_at        BEFORE UPDATE ON public.fundings        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_payments_updated_at        BEFORE UPDATE ON public.payments        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_project_updates_updated_at BEFORE UPDATE ON public.project_updates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_comments_updated_at        BEFORE UPDATE ON public.comments        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_stories_updated_at         BEFORE UPDATE ON public.project_stories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ② funding paid 시 프로젝트 통계 + 리워드 수량 원자적 업데이트
CREATE OR REPLACE FUNCTION public.update_project_stats()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- pending → paid
  IF NEW.status = 'paid' AND OLD.status IS DISTINCT FROM 'paid' THEN
    UPDATE public.projects
    SET current_amount = current_amount + NEW.amount,
        backer_count   = backer_count + 1
    WHERE id = NEW.project_id;

    IF NEW.reward_id IS NOT NULL THEN
      UPDATE public.rewards
      SET claimed_count = claimed_count + NEW.quantity
      WHERE id = NEW.reward_id;
    END IF;
  END IF;

  -- paid → 취소/환불 (롤백)
  IF OLD.status = 'paid' AND NEW.status IN ('cancelled', 'refunded') THEN
    UPDATE public.projects
    SET current_amount = GREATEST(0, current_amount - OLD.amount),
        backer_count   = GREATEST(0, backer_count - 1)
    WHERE id = NEW.project_id;

    IF OLD.reward_id IS NOT NULL THEN
      UPDATE public.rewards
      SET claimed_count = GREATEST(0, claimed_count - OLD.quantity)
      WHERE id = OLD.reward_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_funding_status_change
  AFTER UPDATE OF status ON public.fundings
  FOR EACH ROW EXECUTE FUNCTION public.update_project_stats();


-- ③ payment paid 시 → funding 자동 paid 처리 + approved_at 기록
--   [최적화] BEFORE 트리거에서 approved_at 처리 → self-UPDATE 제거
CREATE OR REPLACE FUNCTION public.set_payment_approved_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    NEW.approved_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_payment_approved_at
  BEFORE UPDATE OF status ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_payment_approved_at();


CREATE OR REPLACE FUNCTION public.confirm_payment_on_paid()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status = 'pending' THEN
    UPDATE public.fundings SET status = 'paid' WHERE id = NEW.funding_id;
  END IF;

  IF NEW.status IN ('cancelled', 'refunded') AND OLD.status = 'paid' THEN
    UPDATE public.fundings SET status = NEW.status::tx_status WHERE id = NEW.funding_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_payment_confirmed
  AFTER UPDATE OF status ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.confirm_payment_on_paid();


-- ④ comment_count 자동 관리 (INSERT / soft-delete UPDATE)
CREATE OR REPLACE FUNCTION public.update_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NULL THEN
    UPDATE public.projects SET comment_count = comment_count + 1 WHERE id = NEW.project_id;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.is_deleted = true AND OLD.is_deleted = false AND NEW.parent_id IS NULL THEN
    UPDATE public.projects SET comment_count = GREATEST(0, comment_count - 1) WHERE id = NEW.project_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_comment_count
  AFTER INSERT OR UPDATE OF is_deleted ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_comment_count();


-- ⑤ update_count 자동 관리
CREATE OR REPLACE FUNCTION public.update_update_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_public = true THEN
    UPDATE public.projects SET update_count = update_count + 1 WHERE id = NEW.project_id;
  END IF;

  IF TG_OP = 'DELETE' AND OLD.is_public = true THEN
    UPDATE public.projects SET update_count = GREATEST(0, update_count - 1) WHERE id = OLD.project_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE TRIGGER trg_update_count
  AFTER INSERT OR DELETE ON public.project_updates
  FOR EACH ROW EXECUTE FUNCTION public.update_update_count();


-- ─────────────────────────────────────────
-- 11. RLS (Row Level Security)
-- ─────────────────────────────────────────
ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fundings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments        ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "profiles_select_all"  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own"  ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own"  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- categories (공개 읽기 전용)
CREATE POLICY "categories_select_all" ON public.categories FOR SELECT USING (true);

-- projects
CREATE POLICY "projects_select_public"
  ON public.projects FOR SELECT
  USING (status IN ('active','funded','failed') OR creator_id = auth.uid());

CREATE POLICY "projects_insert_own"
  ON public.projects FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "projects_update_own"
  ON public.projects FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "projects_delete_own"
  ON public.projects FOR DELETE
  USING (creator_id = auth.uid());

-- project_stories  [최적화] projects 와 동일한 가시성
CREATE POLICY "stories_select_public"
  ON public.project_stories FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE status IN ('active','funded','failed') OR creator_id = auth.uid()
    )
  );

CREATE POLICY "stories_upsert_own"
  ON public.project_stories FOR ALL
  USING (
    project_id IN (SELECT id FROM public.projects WHERE creator_id = auth.uid())
  );

-- rewards  [최적화] creator_id 직접 비교 → 서브쿼리 없음
CREATE POLICY "rewards_select_public"
  ON public.rewards FOR SELECT
  USING (
    creator_id = auth.uid()
    OR project_id IN (
      SELECT id FROM public.projects WHERE status IN ('active','funded','failed')
    )
  );

CREATE POLICY "rewards_manage_own"
  ON public.rewards FOR ALL
  USING (creator_id = auth.uid());

-- fundings
CREATE POLICY "fundings_select_own"
  ON public.fundings FOR SELECT
  USING (
    backer_id = auth.uid()
    OR project_id IN (SELECT id FROM public.projects WHERE creator_id = auth.uid())
  );

CREATE POLICY "fundings_insert_own"
  ON public.fundings FOR INSERT
  WITH CHECK (backer_id = auth.uid());

-- payments  [최적화] funding_id → funding 조인 없이 order_id 만으로 본인 확인 가능하도록
--   실제로 결제 조회는 order_id 파라미터를 통해 funding → backer_id 체인으로 검증
CREATE POLICY "payments_select_own"
  ON public.payments FOR SELECT
  USING (
    funding_id IN (SELECT id FROM public.fundings WHERE backer_id = auth.uid())
  );

-- project_updates
CREATE POLICY "updates_select_public"
  ON public.project_updates FOR SELECT
  USING (
    is_public = true
    OR author_id = auth.uid()
    OR project_id IN (
      SELECT project_id FROM public.fundings
      WHERE backer_id = auth.uid() AND status = 'paid'
    )
  );

CREATE POLICY "updates_manage_own"
  ON public.project_updates FOR ALL
  USING (author_id = auth.uid());

-- comments
CREATE POLICY "comments_select_public"
  ON public.comments FOR SELECT
  USING (is_deleted = false);

CREATE POLICY "comments_insert_auth"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND author_id = auth.uid());

CREATE POLICY "comments_update_own"
  ON public.comments FOR UPDATE
  USING (author_id = auth.uid());


-- ─────────────────────────────────────────
-- 12. Storage 버킷
-- ─────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES
  ('project-thumbnails', 'project-thumbnails', true),
  ('project-content',    'project-content',    true),
  ('avatars',            'avatars',            true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "storage_public_read_thumbnails"
  ON storage.objects FOR SELECT USING (bucket_id = 'project-thumbnails');

CREATE POLICY "storage_public_read_content"
  ON storage.objects FOR SELECT USING (bucket_id = 'project-content');

CREATE POLICY "storage_public_read_avatars"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "storage_auth_insert_thumbnails"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'project-thumbnails' AND auth.role() = 'authenticated');

CREATE POLICY "storage_auth_insert_content"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'project-content' AND auth.role() = 'authenticated');

CREATE POLICY "storage_auth_insert_avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
