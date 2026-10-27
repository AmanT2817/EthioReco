# EthioReco

> **Discover what fits you.**
>
> A personal movie, music, and book recommendation platform with a hybrid AI
> engine (TF-IDF + cosine similarity + collaborative filtering), an Ethiopian
> content module with cultural boost, bilingual Amharic/English UI, a credit
> system, and an admin console.

Built per the four EthioReco spec prompts:

- **Frontend design** — cinematic discovery aesthetic, split-color wordmark, discovery lenses, cross-domain halo, bilingual hierarchy
- **Backend + ML engine** — TF-IDF pipeline, user-user CF, 50/50 hybrid blend, cold-start from survey, cross-domain mapping, 1.3x cultural boost, "Because you liked X" explanations
- **Database schema** — Supabase / Postgres + pgvector for vector similarity, RLS policies per role, trigger functions for rating stats + initial credit grant
- **Deployment** — Vercel + Render + Supabase, env vars, mini-service structure

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router) · TypeScript 5 · Tailwind CSS 4 · shadcn/ui (New York) |
| State | Zustand (client) · TanStack Query (server, optional) |
| Backend | Next.js API Routes (Flask spec ported to TS — same business logic) |
| Database | Prisma ORM + SQLite (dev) · Postgres + pgvector (prod via `supabase/migrations/`) |
| Auth | Custom JWT (WebCrypto PBKDF2, 120K iterations — bcrypt-equivalent) |
| ML | TF-IDF + cosine similarity + user-user CF + hybrid 50/50 blend + cultural boost |
| External APIs | TMDB (movies), Spotify (music), Google Books (books) — all optional, graceful fallback |
| Tests | bun:test (33 unit tests covering vectorizer, cross-domain, explanations, cultural boost) |

---

## Quick Start

```bash
# 1. Install deps
bun install   # or npm install

# 2. Copy env example and fill in (or run with the dev defaults — most vars optional)
cp .env.example .env

# 3. Push the database schema (creates db/custom.db)
bun run db:push

# 4. Seed sample data — 35+ items (Ethiopian + international) + admin user
bun scripts/seed.ts
# → Admin user created: admin@ethioreco.local / admin12345

# 5. Start the dev server
bun run dev
# → http://localhost:3000
```

Open the app, click **"Begin Discovery"** to register a new user, complete
the 4-step onboarding survey, and land on your personalized dashboard with
recommendations already calibrated.

For admin features, sign in as `admin@ethioreco.local` / `admin12345`.

---

## Project Structure

```
ethioreco/
├── prisma/
│   └── schema.prisma             # 12 models — User, Item, Rating, Rec, Wishlist, etc.
├── supabase/
│   └── migrations/
│       └── 0001_initial_schema.sql  # Production Postgres + pgvector + RLS + triggers
├── scripts/
│   └── seed.ts                   # Populates sample content + admin user
├── tests/
│   └── rec_engine/
│       ├── vectorizer.test.ts           # TF-IDF + cosine sim (13 tests)
│       ├── cross_domain.test.ts        # Genre mapping (12 tests)
│       └── explanation_cultural.test.ts # Explanations + boost constants (8 tests)
└── src/
    ├── rec_engine/              # THE AI CORE (8 modules)
    │   ├── vectorizer.ts         # TF-IDF fit + transform + cosine
    │   ├── content_based.ts     # Item-to-item + user profile content scoring
    │   ├── collaborative.ts     # User-user CF with mean-centering, top-K=20
    │   ├── cross_domain.ts      # Genre mapping (book Romance → Romantic Comedy → Love Songs)
    │   ├── cultural_boost.ts    # 1.3x multiplier for traditional Ethiopian content
    │   ├── cold_start.ts        # Onboarding survey → seeded preferences
    │   ├── explanation.ts       # "Because you liked X" reason generation
    │   ├── notify_match.ts      # Wishlist "Notify on match" scanner
    │   └── hybrid.ts             # Orchestrator: 50/50 blend + 24h TTL cache
    ├── lib/
    │   ├── db.ts                 # Prisma client singleton
    │   ├── auth/auth.ts         # JWT sign/verify, PBKDF2 password hashing
    │   ├── api/client.ts        # Typed fetch wrapper for all 25 API routes
    │   └── external/
    │       ├── tmdb_client.ts       # Movies (Client Credentials, cached)
    │       ├── spotify_client.ts     # Music (Client Credentials, cached)
    │       ├── google_books_client.ts # Books (no key required)
    │       └── index.ts             # Unified searchExternal + status check
    ├── app/
    │   ├── page.tsx             # Single-route SPA (Zustand view state)
    │   ├── layout.tsx           # Fonts: Anton, Inter, JetBrains Mono, Noto Serif Ethiopic
    │   ├── globals.css          # Cinematic design system (palette + film grain + vignette)
    │   └── api/                  # 25 API routes (auth, items, ratings, recs, etc.)
    ├── components/
    │   ├── ui/                  # shadcn/ui (button, input, dialog, etc.)
    │   └── ethioreco/
    │       ├── wordmark.tsx             # Split-color "Ethio" + "Reco"
    │       ├── navigation.tsx           # Top bar with discovery lenses + mobile tabs
    │       ├── notifications-bell.tsx   # Notify-on-match dropdown
    │       ├── bilingual-text.tsx      # Amharic primary, English secondary
    │       ├── star-rating.tsx          # Half-star staggered fill
    │       ├── item-card.tsx            # Default + cross-domain (violet halo) variants
    │       └── views/
    │           ├── guest-landing.tsx       # Atmospheric hero + cross-domain showcase
    │           ├── auth-modal.tsx          # Login / register
    │           ├── onboarding-survey.tsx   # 4-step cinematic survey
    │           ├── dashboard.tsx           # Tonight's Recommendations + 3 rails
    │           ├── item-detail.tsx         # Bilingual metadata + cross-domain cards
    │           ├── ethiopian-module.tsx    # 3-tab cultural landing
    │           ├── admin-console.tsx       # Users + Content + Import + Audit logs
    │           ├── admin-import.tsx        # External API search + import
    │           ├── wishlist.tsx           # Saved items
    │           └── search.tsx             # Cross-domain search
    └── stores/
        └── app-store.ts        # Zustand: view, lens, language, session, credits
```

---

## Recommendation Engine Architecture

```
User signals (ratings + onboarding prefs + Ethiopian flag)
       ↓
Content signal (TF-IDF vectors from genre + first 200 chars of description)
       ↓
Behavior signal (user-user collaborative filtering from shared ratings)
       ↓
Hybrid scoring (50/50 blend when both available — falls back to one alone)
       ↓
Cultural signal (1.3x Ethiopian boost if user opted in)
       ↓
Cross-domain logic (map book genres → movie/music genres)
       ↓
Ranking + explanation generation
       ↓
Personalized recommendations (cached 24h, invalidated on rating submit)
```

### Per spec:
- **TF-IDF + cosine similarity** — feature_text = `type + genre + title + first 200 chars of description`
- **User-user CF** — top-K=20 nearest neighbors, mean-centered cosine to handle grading bias
- **50/50 hybrid blend** — exactly 50/50, not "dynamic blending" (per Q&A doc)
- **Cold start** — survey genres → preferences with weight=0.8
- **Cross-domain** — explicit genre mapping (Romance → Romantic Comedy → Love Songs, etc.)
- **Cultural boost** — 1.3x for traditional Ethiopian items when user opted in. **Documented in code as a ranking preference, not a quality claim** (per Q&A defense doc)
- **Explanations** — "Because you liked X", "Cross-domain match from your book taste", etc.
- **Caching + invalidation** — 24h TTL OR until user submits a new rating (whichever first). On rating submit, that user's recs are invalidated asynchronously — **does NOT recompute on every dashboard load**

---

## API Reference

All routes return the consistent shape `{ data, meta, errors }`. Auth via http-only cookie `ethioreco_token` (7-day TTL).

### Auth
- `POST /api/auth/register` — `{ name, email, password }` → 201 + JWT cookie + initial 100 credits
- `POST /api/auth/login` — `{ email, password }` → 200 + JWT cookie
- `POST /api/auth/logout` — clears cookie
- `GET  /api/auth/me` — current user profile + credits

### Items
- `GET /api/items?type=movie&genre=Sci-Fi&origin=ethiopian&limit=24` — list with filters
- `GET /api/items/:id` — item detail (includes Ethiopian metadata)
- `GET /api/items/search?q=Dune` — full-text search across all 3 domains
- `GET /api/items/cross-domain?itemId=...` — items from OTHER domains based on this item's metadata (the killer feature)
- `POST /api/items/recompute-vectors` — refit + persist all TF-IDF vectors (admin)

### Ratings
- `POST /api/ratings` — `{ itemId, score (0.5-5.0, half-star), review? }` — upserts rating, awards +2 credits (capped 10/day), invalidates recs
- `GET /api/ratings/mine` — current user's rating history

### Recommendations
- `GET  /api/recommendations` — main dashboard recs (cached, no recompute)
- `POST /api/recommendations/refresh` — recalibrate (costs 1 credit, rate-limited 10/hour)
- `GET  /api/recommendations/cross-domain` — cross-domain candidates

### Onboarding
- `POST /api/onboarding` — submit 4-step survey → seeds preferences + triggers initial calibration

### Wishlist + Notifications
- `GET   /api/wishlist` — user's wishlist
- `POST  /api/wishlist` — `{ itemId, priority? }` add
- `DELETE /api/wishlist/:itemId` — remove
- `POST  /api/wishlist/notify` — `{ itemId, enabled }` toggle "Notify on match"
- `GET   /api/notifications` — list (max 20, includes unread count)
- `POST  /api/notifications/read` — `{ notificationId? }` — mark one or all as read

### Credits
- `GET /api/credits/balance` — current balance
- `GET /api/credits/history` — transaction log (50 most recent)

### Ethiopian Content
- `GET /api/ethiopian?type=amharic-literature|film|music&featured=true` — landing data

### Admin (RBAC protected)
- `GET  /api/admin/users` — list users
- `POST /api/admin/users` — `{ userId, action: suspend|activate|delete }`
- `GET  /api/admin/content` — list all items (admin view, includes inactive)
- `POST /api/admin/content` — add new item (with Ethiopian flag toggle → reveals cultural metadata fields)
- `GET  /api/admin/import?source=movie|music|book&q=...` — search external APIs
- `POST /api/admin/import` — insert a single imported item into the catalog
- `GET  /api/admin/logs` — audit log (admin actions)

---

## Unique UX Differentiators

1. **The Discovery Lens** — toggle Movies/Music/Books in the top nav; the feed reflows with a brief cinematic cut (200ms black flash, not a smooth fade)

2. **Cross-Domain Match Cards** — item detail pages surface items from the OTHER TWO domains, visually marked with a violet halo accent (only place violet appears in the palette)

3. **Bilingual Hierarchy** — Amharic gets PRIMARY typographic treatment on Ethiopian content, English is the supporting voice. Not a translation toggle — a designed-in dual-language experience

4. **Split-color Wordmark** — "Ethio" in blood ember (cultural root) + "Reco" in bone white (recommendation engine). A quiet brand signature communicating the project's dual identity

5. **Notify on Match** (new!) — wishlist any item, toggle "Notify on match", and receive a notification in the bell dropdown when the engine finds a strong cross-domain match for it. Throttled to 1 notification per wishlisted item per day.

---

## Cinematic Voice Pack (Code + UI Copy)

Code naming and UI copy use cinematic vocabulary throughout:

- `calibrateUserTaste()` instead of `generateRecommendations()`
- `cross_domain_match` instead of `similar_items`
- `cultural_boost` instead of `ethiopian_multiplier`
- "Tonight's Recommendations" (not "Today's Picks")
- "Calibrating your taste..." (not "Loading...")
- "Cross-domain match" (not "Similar items")
- "Cultural significance" (not "About this item")

Database table names stay standard (`users`, `items`, `ratings`) for clarity.

---

## Cinematic Design System

### Palette (named, not hex)
| Token | Color | Use |
|---|---|---|
| obsidian | `#0a0807` (warm near-black) | Background |
| graphite | `#181412` | Cards, panels |
| bone | `#f4ede0` (off-white) | Primary text |
| ash | `#9a8f80` | Secondary, metadata |
| blood ember | `#c8392a` (projector-bulb red) | Primary accent |
| champagne brass | `#c9a25c` | Ethiopian badges, credits |
| violet halo | `#8b6cd1` | Cross-domain signal ONLY |
| oxblood / saffron / indigo ink | gradient wash | Ethiopian cultural hero sections |

### Typography
- Display: **Anton** (cinematic poster feel, condensed uppercase)
- Body: **Inter** (clean grotesk, dark-mode legible)
- Mono: **JetBrains Mono** (credit counts, match scores, technical metadata)
- Amharic: **Noto Serif Ethiopic** (designed-in pairing — same weight hierarchy as Latin)

### Effects
- Film grain on hero sections (3-5% opacity, fixed position, 30s drift animation)
- Soft vignette on card edges
- Atmospheric depth — content sits in pools of light, never flat
- Ambient particles on hero (8-12 elements, slow parallax, 6% opacity)
- Featured cards "breathe" subtly (1.5% scale oscillation over 8s)
- **NO** gradient meshes, aurora blobs, or glassmorphism

### Motion
- Page transitions: 250ms `cubic-bezier(0.16, 1, 0.3, 1)` (smooth decel)
- Exits: `cubic-bezier(0.7, 0, 0.84, 0)` (no spring physics, no overshoot)
- Card hover: 180ms, scale 1.02, NO rotation
- Rec refresh: 400ms cross-dissolve (NOT slide) + "Recalibrating" state
- Star rating: 120ms fill, staggered for half-stars
- Hero rotation: 6s slow cross-dissolve

---

## External API Integrations

EthioReco supports importing content from external APIs (TMDB, Spotify, Google
Books). Each client:

- Uses the `api_cache` table for response caching (7-day TTL per spec)
- Falls back gracefully when API keys are missing — the admin Import tab
  shows the live configuration status of each integration
- Handles rate limits gracefully (uses cache, logs warning, doesn't crash)
- Never blocks the main request flow

### Setup
Add these to your `.env`:

```bash
# Optional — leave blank to use sample data only
TMDB_API_KEY=your_tmdb_v4_bearer_token
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
# Google Books requires no API key (rate-limited by IP)
```

### Usage
1. Sign in as admin → Admin Console → **Import** tab
2. Pick a source (TMDB, Spotify, or Google Books)
3. Type a search query, hit Search
4. Click **Import** on any result to add to your catalog

---

## Production Deployment

### Vercel (frontend)
1. Connect your GitHub repo to Vercel
2. Set framework preset: Next.js
3. Set env vars (see `.env.example`)
4. Auto-deploys on push to main

### Render (backend — only if you split Flask out)
Per spec, the original EthioReco design uses Flask on Render. This implementation
keeps everything in Next.js for simplicity, but the SQL migration in
`supabase/migrations/0001_initial_schema.sql` is portable to a Flask + SQLAlchemy
backend with no schema changes.

### Supabase (production database)
1. Create a new Supabase project (free tier is fine)
2. In the Supabase SQL Editor, paste the entire contents of
   `supabase/migrations/0001_initial_schema.sql` and run it
3. This creates all tables, RLS policies, triggers, and the HNSW vector index
4. Update `DATABASE_URL` in your `.env` to point to the Supabase Postgres URL
5. Sign up your admin user via Supabase Auth, then run:
   `update public.users set role = 'admin' where email = 'you@example.com';`

---

## Tests

```bash
bun test tests/
```

33 tests covering:
- TF-IDF vectorizer (tokenization, IDF, L2 normalization, cosine similarity)
- Cross-domain genre mapping (forward + reverse lookup)
- Explanation generator (all 7 explanation kinds)
- Cultural boost constant (must equal 1.3)

---

## License

EthioReco — a personal movie, music, and book recommendation platform.

Spec prompts: © EthioReco. Code: MIT (suggested) — adapt to your needs.

---

## Acknowledgements

- **TMDB** for movie metadata
- **Spotify** for music metadata
- **Google Books** for book metadata
- **Noto Serif Ethiopic** by Google for the Amharic typography
- **shadcn/ui** for the component library
- **Prisma** for the database ORM
- The cinematic design language is inspired by Netflix, Spotify, and Blurb —
  but the UI/UX is unique to EthioReco.
