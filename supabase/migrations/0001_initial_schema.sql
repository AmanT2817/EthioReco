-- =====================================================
-- EthioReco — Supabase / PostgreSQL Schema + RLS + Triggers
-- Production-ready migration script. Apply this to a fresh Supabase project
-- (or any Postgres 15+ instance with the pgvector extension).
--
-- Usage:
--   1. Create a new Supabase project (free tier is fine for a graduation project).
--   2. In the Supabase SQL Editor, run this entire file.
--   3. Update your backend's SUPABASE_DB_URL env var to point to this project.
--   4. Run your Prisma migrate / db push against the same DB (optional — this
--      script already defines the schema; Prisma will introspect it).
--
-- Spec source: ethioreco-database-deployment-prompt.md
-- =====================================================

-- =====================================================
-- 1. EXTENSIONS
-- =====================================================
-- pgvector: TF-IDF vector storage + cosine similarity search
create extension if not exists vector;

-- uuid-ossp: UUID primary keys
create extension if not exists "uuid-ossp";

-- pg_trgm: full-text search on titles/descriptions
create extension if not exists pg_trgm;

-- citext: case-insensitive emails
create extension if not exists citext;

-- =====================================================
-- 2. SCHEMA
-- =====================================================

-- 2.1 USERS (profile data — auth lives in Supabase Auth / auth.users)
create table if not exists public.users (
  id                  uuid primary key references auth.users(id) on delete cascade,
  name                varchar(100) not null,
  email               citext not null unique,
  preferred_language  varchar(2) default 'en',     -- 'en' or 'am' (Amharic)
  ethiopian_preference boolean default false,
  status              varchar(20) default 'active', -- active/suspended/deleted
  role                varchar(20) default 'user',  -- user/admin
  created_at          timestamptz default now(),
  last_login_at       timestamptz,
  onboarding_completed boolean default false
);

-- 2.2 ITEMS (unified content table)
create table if not exists public.items (
  id                uuid primary key default uuid_generate_v4(),
  title             varchar(255) not null,
  type              varchar(10) not null check (type in ('book', 'movie', 'music')),
  description       text,
  release_year      int,
  language          varchar(50),
  country           varchar(50),
  cover_image_url   text,
  external_id       varchar(100),
  external_source   varchar(20),  -- tmdb/spotify/google_books/manual
  average_rating    decimal(3,2) default 0,
  rating_count      int default 0,
  status            varchar(20) default 'active',
  -- denormalized type-specific attrs (avoids join overhead on hot paths)
  author            varchar(255),  -- book
  director          varchar(255),  -- movie
  artist             varchar(255),  -- music
  album              varchar(255),  -- music
  genre              varchar(100),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists idx_items_type   on public.items(type);
create index if not exists idx_items_external on public.items(external_source, external_id);
create index if not exists idx_items_search on public.items using gin (title gin_trgm_ops);

-- 2.3 RATINGS
create table if not exists public.ratings (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  item_id       uuid not null references public.items(id) on delete cascade,
  score         decimal(2,1) not null check (score >= 0.5 and score <= 5.0),
  review        text,
  not_interested boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(user_id, item_id)
);
create index if not exists idx_ratings_user on public.ratings(user_id);
create index if not exists idx_ratings_item on public.ratings(item_id);

-- 2.4 PREFERENCES (from onboarding + rating patterns)
create table if not exists public.preferences (
  id        uuid primary key default uuid_generate_v4(),
  user_id   uuid not null references public.users(id) on delete cascade,
  category  varchar(10) not null,  -- book/movie/music
  genre     varchar(100) not null,
  weight    decimal(3,2) default 0.5,
  source    varchar(20) default 'rating',  -- survey/rating/manual
  updated_at timestamptz default now(),
  unique(user_id, category, genre)
);

-- 2.5 ITEM_VECTORS (pgvector — the AI core storage)
create table if not exists public.item_vectors (
  item_id      uuid primary key references public.items(id) on delete cascade,
  embedding    vector(384) not null,  -- dimension = your TF-IDF vocabulary size
  feature_text text,
  vectorized_at timestamptz default now()
);
-- HNSW index for fast cosine similarity search (production-grade)
create index if not exists idx_item_vectors_embedding
  on public.item_vectors using hnsw (embedding vector_cosine_ops);

-- 2.6 RECOMMENDATIONS (cached, with TTL)
create table if not exists public.recommendations (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null references public.users(id) on delete cascade,
  item_id                 uuid not null references public.items(id) on delete cascade,
  score                   decimal(5,4) not null,
  rank                    int not null,
  algorithm               varchar(20) not null,  -- content/collab/hybrid/cross_domain/cold_start
  explanation             text,
  cross_domain            boolean default false,
  ethiopian_boost_applied boolean default false,
  generated_at            timestamptz default now(),
  expires_at              timestamptz not null,
  clicked_at              timestamptz,
  dismissed_at            timestamptz
);
create index if not exists idx_recs_user_expires on public.recommendations(user_id, expires_at);
create index if not exists idx_recs_algorithm on public.recommendations(algorithm);

-- 2.7 RECOMMENDATION FEEDBACK
create table if not exists public.recommendation_feedback (
  id                 uuid primary key default uuid_generate_v4(),
  recommendation_id  uuid not null references public.recommendations(id) on delete cascade,
  user_id            uuid not null references public.users(id) on delete cascade,
  action             varchar(20) not null,  -- clicked/dismissed/rated
  rating_given       decimal(2,1),
  created_at         timestamptz default now()
);

-- 2.8 WISHLIST (with notify_on_match flag for "Notify when matched" feature)
create table if not exists public.wishlist (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references public.users(id) on delete cascade,
  item_id           uuid not null references public.items(id) on delete cascade,
  priority          varchar(10) default 'medium',
  notes             text,
  notify_on_match   boolean default false,
  last_notified_at  timestamptz,
  created_at        timestamptz default now(),
  unique(user_id, item_id)
);

-- 2.9 NOTIFICATIONS — "Notify when matched" + system alerts
create table if not exists public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  type        varchar(40) not null,  -- cross_domain_match|rating_threshold|cultural_pick|rec_refreshed|admin_message
  title       varchar(255) not null,
  body        text not null,
  item_id     uuid references public.items(id) on delete set null,
  match_score decimal(5,4),
  read        boolean default false,
  created_at  timestamptz default now()
);
create index if not exists idx_notifications_user_read on public.notifications(user_id, read);
create index if not exists idx_notifications_user_created on public.notifications(user_id, created_at);

-- 2.10 CREDITS (100 initial per spec)
create table if not exists public.credits (
  user_id    uuid primary key references public.users(id) on delete cascade,
  balance    int not null default 100,
  updated_at timestamptz default now()
);

create table if not exists public.credit_transactions (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.users(id) on delete cascade,
  amount       int not null,  -- positive = credit, negative = debit
  reason       varchar(50) not null,  -- initial/rec_refresh/rating_reward/purchase/onboarding_bonus
  reference_id uuid,  -- recommendation_id if rec_refresh
  created_at   timestamptz default now()
);

-- 2.11 ETHIOPIAN CONTENT METADATA
create table if not exists public.ethiopian_metadata (
  item_id                uuid primary key references public.items(id) on delete cascade,
  cultural_region       varchar(100),
  traditional_genre      varchar(100),
  is_traditional         boolean default false,
  amharic_title          varchar(255),
  amharic_description    text,
  cultural_significance  text,
  featured_priority      int default 0,
  curated_by             varchar(100),
  curation_date          timestamptz default now()
);

-- 2.12 ADMIN LOGS
create table if not exists public.admin_logs (
  id           uuid primary key default uuid_generate_v4(),
  admin_id     uuid not null references public.users(id),
  action       varchar(100) not null,
  target_type  varchar(20),
  target_id    uuid,
  ip_address   inet,
  created_at   timestamptz default now()
);

-- 2.13 API CACHE (external API responses)
create table if not exists public.api_cache (
  cache_key   varchar(255) primary key,
  source      varchar(20) not null,
  response    jsonb not null,
  expires_at  timestamptz not null,
  created_at  timestamptz default now()
);

-- =====================================================
-- 3. ROW-LEVEL SECURITY (RLS) POLICIES
-- =====================================================
-- Note: Backend Flask uses the service_role key, which bypasses RLS.
-- Frontend Next.js uses the anon key + auth.uid() context, subject to these policies.

-- 3.1 USERS
alter table public.users enable row level security;
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);
create policy "users_update_own" on public.users
  for update using (auth.uid() = id);
create policy "admin_all_users" on public.users
  for all using (exists(select 1 from public.users where id = auth.uid() and role = 'admin'));

-- 3.2 ITEMS — public read, admin write
alter table public.items enable row level security;
create policy "items_public_read" on public.items
  for select using (status = 'active');
create policy "items_admin_write" on public.items
  for all using (exists(select 1 from public.users where id = auth.uid() and role = 'admin'));

-- 3.3 RATINGS — users only see/edit their own
alter table public.ratings enable row level security;
create policy "ratings_select_own" on public.ratings
  for select using (user_id = auth.uid());
create policy "ratings_insert_own" on public.ratings
  for insert with check (user_id = auth.uid());
create policy "ratings_update_own" on public.ratings
  for update using (user_id = auth.uid());
create policy "ratings_delete_own" on public.ratings
  for delete using (user_id = auth.uid());

-- 3.4 PREFERENCES — users only see their own
alter table public.preferences enable row level security;
create policy "prefs_user_all" on public.preferences
  for all using (user_id = auth.uid());

-- 3.5 WISHLIST — users only see their own (incl. notify_on_match state)
alter table public.wishlist enable row level security;
create policy "wishlist_user_all" on public.wishlist
  for all using (user_id = auth.uid());

-- 3.6 NOTIFICATIONS — users only see their own
alter table public.notifications enable row level security;
create policy "notifications_user_all" on public.notifications
  for all using (user_id = auth.uid());

-- 3.7 CREDITS — users see only their own balance (updates via service_role only)
alter table public.credits enable row level security;
create policy "credits_select_own" on public.credits
  for select using (user_id = auth.uid());

alter table public.credit_transactions enable row level security;
create policy "credits_tx_select_own" on public.credit_transactions
  for select using (user_id = auth.uid());

-- 3.8 RECOMMENDATIONS — users see only their own
alter table public.recommendations enable row level security;
create policy "recs_select_own" on public.recommendations
  for select using (user_id = auth.uid());

alter table public.recommendation_feedback enable row level security;
create policy "rec_feedback_own" on public.recommendation_feedback
  for all using (user_id = auth.uid());

-- 3.9 ETHIOPIAN METADATA — public read, admin write
alter table public.ethiopian_metadata enable row level security;
create policy "eth_public_read" on public.ethiopian_metadata
  for select using (true);
create policy "eth_admin_write" on public.ethiopian_metadata
  for all using (exists(select 1 from public.users where id = auth.uid() and role = 'admin'));

-- 3.10 ITEM_VECTORS — public read (needed for similarity search), admin write
alter table public.item_vectors enable row level security;
create policy "vectors_public_read" on public.item_vectors
  for select using (true);
create policy "vectors_admin_write" on public.item_vectors
  for all using (exists(select 1 from public.users where id = auth.uid() and role = 'admin'));

-- 3.11 ADMIN LOGS — admin-only
alter table public.admin_logs enable row level security;
create policy "admin_logs_admin_only" on public.admin_logs
  for select using (exists(select 1 from public.users where id = auth.uid() and role = 'admin'));

-- 3.12 API CACHE — admin-only (frontend shouldn't see raw cached responses)
alter table public.api_cache enable row level security;
create policy "api_cache_admin_only" on public.api_cache
  for all using (exists(select 1 from public.users where id = auth.uid() and role = 'admin'));

-- =====================================================
-- 4. TRIGGERS + FUNCTIONS
-- =====================================================

-- 4.1 Update item average_rating + rating_count on rating change
create or replace function public.update_item_rating_stats()
returns trigger as $$
begin
  update public.items
  set average_rating = (
        select coalesce(avg(score), 0) from public.ratings
        where item_id = new.item_id and not not_interested
      ),
      rating_count = (
        select count(*) from public.ratings
        where item_id = new.item_id and not not_interested
      )
  where id = new.item_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_update_item_rating on public.ratings;
create trigger trg_update_item_rating
  after insert or update or delete on public.ratings
  for each row execute function public.update_item_rating_stats();

-- 4.2 Auto-grant 100 credits to new users (initial allocation per spec)
create or replace function public.grant_initial_credits()
returns trigger as $$
begin
  insert into public.credits (user_id, balance) values (new.id, 100);
  insert into public.credit_transactions (user_id, amount, reason)
  values (new.id, 100, 'initial');
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_grant_credits on public.users;
create trigger trg_grant_credits
  after insert on public.users
  for each row execute function public.grant_initial_credits();

-- 4.3 Auto-update updated_at on items
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_items_touch on public.items;
create trigger trg_items_touch
  before update on public.items
  for each row execute function public.touch_updated_at();

-- =====================================================
-- 5. COSINE SIMILARITY HELPER (optional convenience view)
-- =====================================================
-- This view exposes a function that returns the top-K most similar items
-- to a given item_id, using pgvector's cosine distance operator (<=>).
-- Note: similarity = 1 - (embedding <=> query_embedding)
create or replace function public.similar_items(
  p_item_id uuid,
  p_limit int default 10,
  p_exclude_ids uuid[] default '{}'
)
returns table (
  item_id uuid,
  similarity float
)
language sql stable as $$
  with query as (
    select embedding from public.item_vectors where item_id = p_item_id
  )
  select iv.item_id,
         1 - (iv.embedding <=> q.embedding) as similarity
  from public.item_vectors iv, query q
  where iv.item_id <> p_item_id
    and iv.item_id <> all (coalesce(p_exclude_ids, array[]::uuid[]))
  order by iv.embedding <=> q.embedding
  limit p_limit;
$$;

-- =====================================================
-- 6. STORAGE BUCKETS
-- =====================================================
-- Run this in the Supabase Storage section too:
--   - covers (public read, admin write) — book covers, movie posters, album art
--   - user-avatars (private, owner-only) — user profile pictures
insert into storage.buckets (id, name, public)
  values ('covers', 'covers', true)
  on conflict (id) do nothing;

-- Storage RLS: public read on covers
create policy "covers_public_read" on storage.objects
  for select using (bucket_id = 'covers');
create policy "covers_admin_write" on storage.objects
  for insert with check (
    bucket_id = 'covers' and
    exists(select 1 from public.users where id = auth.uid() and role = 'admin')
  );

-- =====================================================
-- 7. SEED — initial admin user (manual step)
-- =====================================================
-- To create an admin user, sign up a new user via Supabase Auth (so the
-- auth.users row exists), then run:
--   update public.users set role = 'admin' where email = 'you@example.com';

-- Done. Schema is now production-ready for Supabase.
