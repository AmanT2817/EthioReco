# EthioReco — Database + Deployment Spec Prompt

> **Project:** EthioReco
> **Stack:** Supabase (Postgres + pgvector + Auth + Storage) | Vercel (Next.js) | Render (Flask)
> **Voice pack:** Cinematic / Discovery
> **Status:** Ready to paste into any AI when setting up database + deployment

---

## How to use this prompt

Paste this prompt when you want the AI to design the Supabase schema, RLS policies, migrations, or deployment configuration for Vercel + Render.

---

## The Prompt (copy from below this line)

```
Act as a Senior Database Engineer + DevOps Engineer for a
Cinematic Discovery project called ETHIORECO.

PROJECT CONTEXT
EthioReco is a personal movie, music, and book recommendation
platform. Backend is Flask, frontend is Next.js 15, database is
Supabase (PostgreSQL + pgvector + Auth + Storage).

You are designing the Supabase schema, RLS policies, migrations,
and deployment configuration for Vercel + Render.

===================================================
1. SUPABASE PROJECT SETUP
===================================================

1.1 PROJECT CREATION
- Create new Supabase project (free tier is fine for grad project)
- Region: choose closest to users (for Ethiopian users, eu-central-1
  or us-east-1 — Supabase doesn't have African regions yet)
- Strong db password (use a generator, save in password manager)
- Wait for provisioning (~2 min)

1.2 EXTENSIONS TO ENABLE
- pgvector (for TF-IDF vector storage + similarity search)
- uuid-ossp (for UUID primary keys)
- pg_trgm (for full-text search on titles/descriptions)
- citext (case-insensitive emails)

1.3 DATABASE ROLES
- service_role: backend Flask uses this (full access, bypasses RLS)
- anon: frontend Next.js uses this (subject to RLS)
- user: authenticated users (subject to RLS + their own data)

===================================================
2. DATABASE SCHEMA
===================================================

2.1 USERS (profile data — auth lives in Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email CITEXT NOT NULL UNIQUE,
  preferred_language VARCHAR(2) DEFAULT 'en',  -- 'en' or 'am' (Amharic)
  ethiopian_preference BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active',  -- active/suspended/deleted
  role VARCHAR(20) DEFAULT 'user',  -- user/admin
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT false
);

2.2 ITEMS (unified content table)
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('book', 'movie', 'music')),
  description TEXT,
  release_year INT,
  language VARCHAR(50),
  country VARCHAR(50),
  cover_image_url TEXT,  -- Supabase Storage URL
  external_id VARCHAR(100),  -- TMDB ID, Spotify ID, ISBN, etc.
  external_source VARCHAR(20),  -- tmdb/spotify/google_books/manual
  average_rating DECIMAL(3,2) DEFAULT 0,
  rating_count INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_items_type ON items(type);
CREATE INDEX idx_items_external ON items(external_source, external_id);
CREATE INDEX idx_items_search ON items USING gin(title gin_trgm_ops);

2.3 TYPE-SPECIFIC EXTENSIONS (1:1 with items)
CREATE TABLE books (
  item_id UUID PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
  author VARCHAR(255) NOT NULL,
  isbn VARCHAR(20),
  pages INT,
  publisher VARCHAR(100),
  genre VARCHAR(100)
);

CREATE TABLE movies (
  item_id UUID PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
  director VARCHAR(255),
  duration_min INT,
  cast TEXT,
  content_rating VARCHAR(10),
  genre VARCHAR(100)
);

CREATE TABLE music (
  item_id UUID PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
  artist VARCHAR(255) NOT NULL,
  album VARCHAR(255),
  duration_sec INT,
  genre VARCHAR(100),
  track_number INT
);

2.4 RATINGS
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  score DECIMAL(2,1) NOT NULL CHECK (score >= 0.5 AND score <= 5.0),
  review TEXT,
  not_interested BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

CREATE INDEX idx_ratings_user ON ratings(user_id);
CREATE INDEX idx_ratings_item ON ratings(item_id);

-- Trigger to update items.average_rating + rating_count on rating change
-- (write this as a Postgres function + trigger)

2.5 PREFERENCES (from onboarding + rating patterns)
CREATE TABLE preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(10) NOT NULL,  -- book/movie/music
  genre VARCHAR(100) NOT NULL,
  weight DECIMAL(3,2) DEFAULT 0.5,
  source VARCHAR(20) DEFAULT 'rating',  -- survey/rating/manual
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category, genre)
);

2.6 ITEM VECTORS (pgvector — the AI core storage)
CREATE TABLE item_vectors (
  item_id UUID PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
  embedding VECTOR(384) NOT NULL,  -- dimension depends on your TF-IDF
  feature_text TEXT,  -- the text that was vectorized (genre + description)
  vectorized_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW index for fast cosine similarity search
CREATE INDEX idx_item_vectors_embedding
  ON item_vectors USING hnsw (embedding vector_cosine_ops);

2.7 RECOMMENDATIONS (cached, with TTL)
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  score DECIMAL(5,4) NOT NULL,
  rank INT NOT NULL,
  algorithm VARCHAR(20) NOT NULL,  -- content/collab/hybrid/cross_domain/cold_start
  explanation TEXT,  -- "Because you liked X"
  cross_domain BOOLEAN DEFAULT false,
  ethiopian_boost_applied BOOLEAN DEFAULT false,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  clicked_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ
);

CREATE INDEX idx_recs_user_expires ON recommendations(user_id, expires_at);
CREATE INDEX idx_recs_algorithm ON recommendations(algorithm);

2.8 RECOMMENDATION FEEDBACK
CREATE TABLE recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL,  -- clicked/dismissed/rated
  rating_given DECIMAL(2,1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

2.9 WISHLIST
CREATE TABLE wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  priority VARCHAR(10) DEFAULT 'medium',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

2.10 CREDITS
CREATE TABLE credits (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 100,  -- 100 initial credits per Q&A doc
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INT NOT NULL,  -- positive = credit, negative = debit
  reason VARCHAR(50) NOT NULL,  -- initial/rec_refresh/rating_reward/purchase
  reference_id UUID,  -- recommendation_id if rec_refresh
  created_at TIMESTAMPTZ DEFAULT NOW()
);

2.11 ETHIOPIAN CONTENT METADATA
CREATE TABLE ethiopian_metadata (
  item_id UUID PRIMARY KEY REFERENCES items(id) ON DELETE CASCADE,
  cultural_region VARCHAR(100),  -- Gondar/Addis Ababa/Tigray/Oromia
  traditional_genre VARCHAR(100),  -- Tizita/Bati/Anchihoye for music
  is_traditional BOOLEAN DEFAULT false,
  amharic_title VARCHAR(255),
  amharic_description TEXT,
  cultural_significance TEXT,
  featured_priority INT DEFAULT 0,
  curated_by VARCHAR(100),
  curation_date TIMESTAMPTZ DEFAULT NOW()
);

2.12 ADMIN LOGS
CREATE TABLE admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(20),
  target_id UUID,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

2.13 API CACHE (external API responses)
CREATE TABLE api_cache (
  cache_key VARCHAR(255) PRIMARY KEY,
  source VARCHAR(20) NOT NULL,  -- tmdb/spotify/google_books
  response JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

===================================================
3. ROW-LEVEL SECURITY (RLS) POLICIES
===================================================

Enable RLS on every table. Policies:

-- USERS: users can read/update only their own row
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (auth.uid() = id);
-- admins can do anything
CREATE POLICY "admin_all_users" ON users
  FOR ALL USING (EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- ITEMS: public read, admin write
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "items_public_read" ON items
  FOR SELECT USING (status = 'active');
CREATE POLICY "items_admin_write" ON items
  FOR ALL USING (EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- RATINGS: users can only see/edit their own
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ratings_select_own" ON ratings
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "ratings_insert_own" ON ratings
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "ratings_update_own" ON ratings
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "ratings_delete_own" ON ratings
  FOR DELETE USING (user_id = auth.uid());

-- PREFERENCES: users only see their own
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prefs_user_all" ON preferences
  FOR ALL USING (user_id = auth.uid());

-- WISHLIST: users only see their own
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wishlist_user_all" ON wishlist
  FOR ALL USING (user_id = auth.uid());

-- CREDITS: users see only their own
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credits_select_own" ON credits
  FOR SELECT USING (user_id = auth.uid());
-- Updates to balance happen via service_role only (backend Flask)

-- RECOMMENDATIONS: users see only their own
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recs_select_own" ON recommendations
  FOR SELECT USING (user_id = auth.uid());

-- ETHIOPIAN METADATA: public read, admin write
ALTER TABLE ethiopian_metadata ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eth_public_read" ON ethiopian_metadata
  FOR SELECT USING (true);
CREATE POLICY "eth_admin_write" ON ethiopian_metadata
  FOR ALL USING (
    EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- ITEM_VECTORS: public read (needed for similarity search), admin write
ALTER TABLE item_vectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vectors_public_read" ON item_vectors
  FOR SELECT USING (true);
CREATE POLICY "vectors_admin_write" ON item_vectors
  FOR ALL USING (
    EXISTS(SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Note: Backend Flask uses service_role key, which bypasses RLS.
-- Frontend Next.js uses anon key + auth.uid() context.

===================================================
4. TRIGGERS + FUNCTIONS
===================================================

4.1 UPDATE ITEM AVERAGE RATING ON RATING CHANGE
CREATE OR REPLACE FUNCTION update_item_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE items
  SET average_rating = (
        SELECT COALESCE(AVG(score), 0) FROM ratings
        WHERE item_id = NEW.item_id AND NOT not_interested
      ),
      rating_count = (
        SELECT COUNT(*) FROM ratings
        WHERE item_id = NEW.item_id AND NOT not_interested
      )
  WHERE id = NEW.item_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_item_rating
  AFTER INSERT OR UPDATE OR DELETE ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_item_rating_stats();

4.2 AUTO-GRANT 100 CREDITS TO NEW USERS
CREATE OR REPLACE FUNCTION grant_initial_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO credits (user_id, balance) VALUES (NEW.id, 100);
  INSERT INTO credit_transactions (user_id, amount, reason)
  VALUES (NEW.id, 100, 'initial');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_grant_credits
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION grant_initial_credits();

===================================================
5. MIGRATIONS (Alembic)
===================================================

- Use Alembic for all schema changes
- Initial migration creates all tables above
- Seed migration adds:
  - Sample international content (fetched from external APIs)
  - Sample Ethiopian content (manual entry — Tizita tracks, Amharic books,
    Ethiopian films)
  - Genre mapping table for cross-domain logic
- Migrations are version-controlled, never edit applied migrations
- Test migrations on a Supabase branch before applying to prod

===================================================
6. STORAGE (Supabase Storage)
===================================================

- Create buckets:
  - "covers" (public read, admin write) — book covers, movie posters, album art
  - "user-avatars" (private, owner-only) — user profile pictures
- RLS on storage.objects:
  - Public read on covers
  - User-only write on their own avatar
- Use signed URLs for any private assets

===================================================
7. DEPLOYMENT — VERCEL (Next.js frontend)
===================================================

7.1 REPO STRUCTURE
- Mono-repo with /frontend and /backend folders
- Vercel auto-detects Next.js in /frontend

7.2 ENV VARS (Vercel project settings)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_API_BASE_URL (Flask backend URL on Render)
- NEXT_PUBLIC_SITE_URL (your Vercel domain)

7.3 BUILD SETTINGS
- Framework preset: Next.js
- Root directory: frontend
- Build command: npm run build
- Output directory: .next
- Node version: 20

7.4 DEPLOY
- Connect GitHub repo to Vercel
- Auto-deploy on every push to main
- Preview deployments on every PR
- Production deployment on main merge

===================================================
8. DEPLOYMENT — RENDER (Flask backend)
===================================================

8.1 SERVICE TYPE
- Web Service (not background worker — main API)
- Separate background worker for cron jobs (refresh external content weekly)

8.2 ENV VARS (Render service settings)
- SUPABASE_DB_URL (postgres connection string)
- SUPABASE_SERVICE_ROLE_KEY (bypasses RLS — backend only, NEVER expose to frontend)
- JWT_SECRET_KEY
- FLASK_ENV=production
- TMDB_API_KEY
- SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
- GOOGLE_BOOKS_API_KEY
- REDIS_URL (Render Redis add-on)
- CORS_ORIGINS (your Vercel domain)

8.3 BUILD + START COMMANDS
- Build: pip install -r requirements.txt
- Start: gunicorn -w 4 -b 0.0.0.0:$PORT app.wsgi:app
- (4 workers minimum, scale based on traffic)

8.4 HEALTH CHECK
- GET /api/health returns 200 + {"status": "ok"}
- Render uses this for deploy + monitor

8.5 DEPLOY
- Connect GitHub repo to Render
- Auto-deploy on push to main
- Manual deploys available
- View logs in Render dashboard

===================================================
9. CI/CD (GitHub Actions, lightweight)
===================================================

- On PR to main:
  - Run pytest on backend
  - Run npm run build on frontend
  - Run linter (ruff for Python, eslint for JS)
- On merge to main:
  - Vercel auto-deploys frontend
  - Render auto-deploys backend
- No need for separate CI deploy step — Vercel/Render handle it

===================================================
10. LOCAL DEV SETUP
===================================================

- Frontend: npm run dev (Next.js on :3000)
- Backend: flask run --debug (Flask on :5000)
- Database: Supabase local CLI or use cloud dev project
- Use Supabase branches for isolated testing
- Seed script: python scripts/seed_dev.py to populate test data

===================================================
11. ENVIRONMENT VARIABLES MASTER LIST
===================================================

FRONTEND (Vercel)
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_API_BASE_URL
- NEXT_PUBLIC_SITE_URL

BACKEND (Render)
- SUPABASE_DB_URL
- SUPABASE_SERVICE_ROLE_KEY
- JWT_SECRET_KEY
- FLASK_ENV
- TMDB_API_KEY
- SPOTIFY_CLIENT_ID
- SPOTIFY_CLIENT_SECRET
- GOOGLE_BOOKS_API_KEY
- REDIS_URL
- CORS_ORIGINS

NEVER commit any of these to git. Use a .env.example file with
placeholder values for documentation only.
```
