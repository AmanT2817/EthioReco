# EthioReco — Frontend Design Spec Prompt

> **Project name:** EthioReco (Ethio + Reco — Ethiopian Recommendation)
> **Database:** Supabase (PostgreSQL + pgvector + Auth + Storage)
> **Voice pack:** Cinematic / Discovery
> **Reference brands:** Netflix, Spotify, Blurb — but UI/UX must be unique
> **Status:** Ready to paste into any AI when building the frontend

---

## How to use this prompt

Paste the full prompt below into any AI (Claude, GPT, Cursor, v0, etc.) when you want it to build a piece of the EthioReco frontend. The AI will produce design-aligned output. Keep this file as the canonical design reference.

**Tech stack summary:**
- Frontend: Next.js 15 + Tailwind CSS + shadcn/ui
- Backend: Python Flask + scikit-learn + NumPy + Pandas
- Database: Supabase (PostgreSQL + pgvector + Auth + Storage + Realtime)
- Auth: Supabase Auth (JWT-based, Row-Level Security for admin/user roles)
- Vector storage: pgvector for TF-IDF similarity search
- Deployment: Vercel (frontend) + Render/Railway (Flask backend) + Supabase (DB)

**Why Supabase (not MySQL/MongoDB):**
- Postgres is relational — perfect for User → Ratings → Items → Recommendations schema
- pgvector lets you store TF-IDF vectors in the DB and do cosine similarity in SQL (no separate vector DB needed)
- Built-in auth (JWT), storage (for posters/covers), and row-level security (RBAC for admin/user split) — saves you building all that
- Free tier: 500MB DB, 50K MAU auth, 1GB storage — plenty for a graduation project
- Branchable DB (Supabase branches) for dev/prod separation

---

## The Prompt (copy from below this line)

```
Act as a Creative Director for a Cinematic Discovery project.
Reference brands: Netflix, Spotify, Blurb.
CRITICAL: The UI/UX must be unique — not a mashup of those three.
The differentiator is the cross-domain discovery experience and
the Ethiopian cultural layer.

PROJECT: ETHIORECO — a personal movie, music, and book
recommendation platform with a hybrid AI engine (TF-IDF +
cosine similarity + collaborative filtering), an Ethiopian
content module with cultural boost, bilingual Amharic/English
UI, a credit system, and an admin console.

TECH STACK:
- Frontend: Next.js 15 + Tailwind CSS + shadcn/ui
- Backend: Python Flask + scikit-learn + NumPy + Pandas
- Database: Supabase (PostgreSQL + pgvector + Auth + Storage)
- Auth: Supabase Auth (JWT-based, Row-Level Security for admin/user roles)
- Vector storage: pgvector for TF-IDF similarity search
- Deployment: Vercel (frontend) + Render/Railway (backend) + Supabase (DB)

===================================================
1. VISUAL DIRECTION
===================================================
AESTHETIC
Cinematic discovery. Dark, atmospheric, editorial. Feels like
a private screening room crossed with a record store and a
curated library — NOT a streaming grid.

PALETTE (name, not hex)
- Background ......... obsidian (near-black, warm tint, not pure #000)
- Surface ............ graphite (raised cards, panels)
- Ink ................ bone white (primary text, not pure white)
- Whisper ............ ash (secondary, metadata)
- Primary accent ..... blood ember (deep cinematic red — projector-bulb tone, not Netflix red)
- Brass accent ....... champagne brass (Ethiopian badges, credits)
- Cross-domain sig ... violet halo (ONLY on cross-domain rec cards)
- Ethiopian washes ... oxblood / saffron / indigo ink (gradient washes on cultural hero sections, inspired by traditional textile palettes)

TYPOGRAPHY
- Display ............ Druk Condensed or Anton (cinematic poster feel)
- Body ............... Inter or Geist (clean grotesk, dark-mode legible)
- Mono accents ....... JetBrains Mono (credit counts, match scores, technical metadata)
- Amharic ............ Noto Serif Ethiopic (designed-in pairing, NOT a font-swap fallback — same weight hierarchy as Latin headings)

TEXTURE / LIGHT
- Subtle film grain on hero sections (3-5% opacity, fixed position)
- Soft vignette on card edges (not heavy)
- Atmospheric depth — content sits in pools of light, never flat
- Real poster/cover imagery over illustration
- NO gradient meshes, NO aurora blobs, NO glassmorphism

AVOID (hard constraints)
- Bouncy/springy motion — kills the cinematic feel
- Bright/neon accents outside the defined palette
- Equal-height SaaS feature-card grids — this is a discovery product, not a dashboard

===================================================
2. BRAND & NAVIGATION
===================================================
BRAND: ETHIORECO (Ethio + Reco — Ethiopian Recommendation)
TAGLINE: "Discover what fits you."

LOGO TREATMENT
The name is a portmanteau of "Ethio" (Ethiopian) and "Reco"
(Recommendation) — lean into that duality:
- Render as "Ethio" + "Reco" with subtle color separation:
  • "Ethio" in blood ember (signals the cultural root)
  • "Reco" in bone white (signals the recommendation engine)
- Set in condensed uppercase, tracked tight
- Optional single pulse dot before the wordmark
- Brass tone on dark surfaces; ember-red accent on light surfaces
- The split-color treatment becomes a quiet brand signature

NAV STRUCTURE (fixed top bar)
- Left: ETHIORECO wordmark (split-color treatment)
- Center: Three discovery lenses — MOVIES • MUSIC • BOOKS
- Right: Search, Wishlist (count), Credits (count), EN/አማ toggle, Profile

★ UNIQUE UX MOVE #1 — THE DISCOVERY LENS
Rather than separate pages for Movies/Music/Books, the user toggles
between three LENSES that reflow the same discovery feed — like
switching camera lenses on a film set. Lens transitions use a brief
cinematic cut (1-frame black flash, ~200ms), NOT a smooth fade.

MOBILE NAV: Bottom tab bar — Discover • Search • Wishlist • Profile • Admin (role-gated)

===================================================
3. KEY PAGES & MAIN SECTIONS
===================================================

[A] HOME / GUEST LANDING
- Full-bleed atmospheric hero, rotating featured content
  (poster → album art → book cover, 6s cycle, slow cross-dissolve)
- Headline: "Discover what fits you."
- Sub: "Movies, music, and books — one discovery engine.
       Built with Ethiopian cultural relevance."
- Primary CTA: "Begin Discovery" → registration
- Secondary: "Explore as Guest"
- Below fold: Three-column CROSS-DOMAIN DISCOVERY showcase —
  shows how preference in one domain surfaces content in another
  (the killer feature, shown up front, not buried)
- Cultural strip: Featured Ethiopian content, bilingual titles

[B] ONBOARDING SURVEY (post-registration)
- Full-screen, ONE question per step (cinematic pacing)
- Step 1: "What pulls you in?" — pick 3+ genre chips across movies/music/books
- Step 2: "Where do you call home?" — Ethiopian content preference toggle
- Step 3: "Read, watch, or listen first?" — primary medium ranking
- Step 4: "Recent favorites?" — optional free-text for cold-start seeding
- Progress: timeline indicator, NOT percentage bar
- Submit CTA: "Enter EthioReco"

[C] DASHBOARD (logged-in)
- Top: greeting + credit count (mono)
- Hero band: "Tonight's Recommendations" — 5 hand-picked cross-domain items in horizontal scroll
- Each card: cover art, title, match score (mono), reason ("Because you rated X"), domain badge
- Below: three discovery rails (Movies/Music/Books), each its own rec strip
- Sidebar (desktop) / tab (mobile): Ethiopian Content module, Wishlist, Rate-more prompt
- Empty state (low ratings): cinematic "Calibrating your taste..." screen with skeletons

[D] ITEM DETAIL PAGE
- Two-column: Left = cover art (large, atmospheric shadow), Right = metadata
- Metadata: bilingual title (EN + Amharic if Ethiopian), genre tags, avg rating, your rating
- ★ UNIQUE UX MOVE #2 — CROSS-DOMAIN MATCH CARDS
  "If you liked this, you might also like..." shows items from the OTHER TWO
  domains (not same domain). Visually marked with violet halo accent.
- Actions: Rate (5-star), Add to Wishlist, "Not Interested" (negative signal)
- Ethiopian items: brass cultural badge with region (Gondar/Addis) + traditional genre (Tizita/Bati)

[E] ETHIOPIAN CONTENT MODULE
- Dedicated landing with cultural gradient wash (oxblood → saffron)
- Three sections: Amharic Literature / Ethiopian Film / Traditional Music (Tizita, Bati, Anchihoye)
- Bilingual throughout (Amharic primary, English secondary)
- "Cultural significance" editorial callouts on each item
- Featured creators spotlight

[F] ADMIN CONSOLE
- Restrained — not flashy
- Tables: Users, Items, Ratings, Rec cache, Credits, Audit logs
- Add Content form with Ethiopian flag toggle → reveals cultural metadata fields

★ UNIQUE UX MOVE #3 — BILINGUAL HIERARCHY
Amharic gets PRIMARY typographic treatment on Ethiopian content,
English is the supporting voice. NOT a translation toggle — a
designed-in dual-language experience. This becomes a brand signature.

===================================================
4. MOTION & MICRO-INTERACTIONS
===================================================
RESTRAINT LEVEL: High. Cinematic, not bouncy. Every motion is
a film edit, not a UI animation.

TIMING
- Page transitions ..... 250ms ease-out (1-frame black flash on lens switch)
- Card hover ........... 180ms, scale 1.02, NO rotation
- Rec refresh .......... 400ms cross-dissolve (NOT slide) + "Recalibrating" state
- Star rating .......... 120ms fill, staggered for half-stars

EASING
- Entries: cubic-bezier(0.16, 1, 0.3, 1) — smooth decel
- Exits: cubic-bezier(0.7, 0, 0.84, 0)
- NO spring physics, NO overshoot

ATMOSPHERIC MOTION
- Film grain drift (very slow, 30s loop)
- Ambient particles on hero (8-12 elements, slow parallax, low opacity)
- Featured cards "breathe" subtly (1.5% scale oscillation over 8s)

AVOID
- Bouncy spring easings
- Auto-playing video backgrounds (kills low-bandwidth Ethiopian users)
- Aggressive parallax (>0.3 factor)

===================================================
5. TONE OF LANGUAGE
===================================================
Cinematic vocabulary throughout UI copy AND code naming:
- Discovery, screening, curation, taste, signal, lens, frame, cut
- "Tonight's Recommendations" (not "Today's Picks")
- "Calibrating your taste..." (not "Loading...")
- "Cross-domain match" (not "Similar items")
- "Cultural significance" (not "About this item")

Ethiopian content uses editorial tone:
- "Tizita" (not "nostalgia music")
- "Amharic literature" (not "Ethiopian books")
- Cultural context shown, not footnote-d

===================================================
6. NEVER USE (FORBIDDEN)
===================================================
- Words: sleek, modern, cool, awesome, vibrant, pop, bold
- Stock-photo people in marketing
- Neon glow, aurora gradients, glassmorphism
- Bouncy / spring / overshoot motion
- Equal-height feature card grids (SaaS cliché)
- Pastel palettes, soft serif body text
- Auto-playing video or audio
- Loading spinners (use skeleton + "calibrating" copy)
- "Powered by AI" badges, robot iconography
  (the AI is invisible — the discovery is the story)

===================================================
7. UNIQUE UI/UX DIFFERENTIATORS
===================================================
To make EthioReco NOT feel like a Netflix/Spotify/Blurb mashup,
lean into these three unique UX moves:

1. THE DISCOVERY LENS — toggle between Movies/Music/Books that
   reflows the same feed, with cinematic cut transitions.

2. CROSS-DOMAIN MATCH CARDS — visually distinct (violet halo
   accent) from in-domain cards, always surfaced in item detail
   pages, making the killer feature visible.

3. BILINGUAL HIERARCHY — Amharic gets primary typographic
   treatment on Ethiopian content, with English as the supporting
   voice. Not a translation toggle — a designed-in dual-language
   experience that becomes a brand signature.

A 4TH QUIET SIGNAL:
The split-color wordmark ("Ethio" in ember, "Reco" in bone white)
visually communicates the project's dual identity: cultural root
+ recommendation engine. Small but distinctive.
```

---

## What's NOT in this prompt (you still need)

This prompt covers the **frontend design spec only**. The full EthioReco project also needs:

1. **Backend + ML prompt** — Flask app structure, recommendation engine implementation,
   API endpoints (auth, ratings, recs, cross-domain, Ethiopian boost), TF-IDF pipeline,
   pgvector integration with Supabase.
2. **Database + deployment prompt** — Supabase schema, RLS policies, pgvector setup,
   migrations, env vars, Vercel + Render deploy configs.

Tell me when you're ready for those.
