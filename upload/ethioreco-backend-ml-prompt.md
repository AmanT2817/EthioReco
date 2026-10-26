# EthioReco — Backend + ML Spec Prompt

> **Project:** EthioReco
> **Stack:** Python Flask + scikit-learn + Supabase (Postgres + pgvector)
> **Voice pack:** Cinematic / Discovery
> **Status:** Ready to paste into any AI when building the Flask backend

---

## How to use this prompt

Paste this prompt when you want the AI to build a piece of the Flask backend or recommendation engine. Pair with the frontend design prompt for full-stack context.

---

## The Prompt (copy from below this line)

```
Act as a Senior Backend Engineer + ML Engineer for a Cinematic
Discovery project called ETHIORECO.

PROJECT CONTEXT
EthioReco is a personal movie, music, and book recommendation
platform with a hybrid AI engine, an Ethiopian content module
with cultural boost, bilingual Amharic/English UI, a credit
system, and an admin console.

You are building the Flask backend + recommendation engine.
The frontend is Next.js 15 (specced separately).

TECH STACK
- Python 3.11+ with Flask
- SQLAlchemy 2.0 (ORM) connecting to Supabase Postgres
- scikit-learn (TF-IDF, cosine similarity), NumPy, Pandas
- pgvector extension in Supabase for vector storage + similarity
- Flask-JWT-Extended for auth
- bcrypt for password hashing
- rate limiting via Flask-Limiter
- caching via Redis (Render Redis) or in-memory fallback
- external APIs: TMDB (movies), Spotify (music), Google Books (books)

===================================================
1. APPLICATION ARCHITECTURE
===================================================

DIRECTORY STRUCTURE (modular, blueprint-based)
ethioreco-backend/
├── app.py                    # Flask app factory
├── config.py                 # Env-based config
├── extensions.py             # db, jwt, limiter, cache init
├── blueprints/
│   ├── auth.py               # register, login, logout, refresh
│   ├── items.py              # list, detail, search, filter
│   ├── ratings.py            # submit, update, delete, list
│   ├── recommendations.py    # get recs, cross-domain, refresh
│   ├── onboarding.py         # survey submission → preference seeding
│   ├── wishlist.py           # add, remove, list
│   ├── credits.py            # balance, deduct, reward, history
│   ├── admin.py              # users, content, analytics, logs
│   └── ethiopian.py          # cultural content module
├── services/
│   ├── auth_service.py
│   ├── item_service.py
│   ├── rating_service.py
│   ├── recommendation_service.py   # orchestrator
│   ├── onboarding_service.py
│   ├── credit_service.py
│   └── external/
│       ├── tmdb_client.py
│       ├── spotify_client.py
│       └── google_books_client.py
├── rec_engine/               # the heart of the AI
│   ├── __init__.py
│   ├── content_based.py      # TF-IDF + cosine similarity (uses pgvector)
│   ├── collaborative.py      # user-user CF (rating pattern similarity)
│   ├── hybrid.py             # 50/50 blend per Q&A doc
│   ├── cold_start.py         # onboarding survey → seeded preferences
│   ├── cross_domain.py       # book genre → movie/music genre mapping
│   ├── cultural_boost.py    # 1.3x Ethiopian content multiplier
│   ├── explanation.py        # "Because you liked X" generation
│   └── vectorizer.py         # TF-IDF pipeline, fits + persists vectors
├── dao/
│   ├── user_dao.py
│   ├── item_dao.py
│   ├── rating_dao.py
│   ├── recommendation_dao.py
│   ├── preference_dao.py
│   ├── wishlist_dao.py
│   ├── credit_dao.py
│   └── ethiopian_dao.py
├── models/                   # SQLAlchemy ORM models
├── schemas/                  # Pydantic / marshmallow input validation
├── utils/
│   ├── validators.py
│   ├── exceptions.py
│   ├── logger.py
│   └── cache.py
├── migrations/               # Alembic migrations
├── tests/
└── requirements.txt

LAYER RULES
- Controllers (blueprints) handle HTTP only — no business logic.
- Services contain business logic and call DAOs.
- DAOs contain DB queries only — no business logic.
- Rec engine modules are pure functions — no Flask context, no DB
  writes except via the recommendation_dao.
- External API clients are isolated, with response caching.

===================================================
2. API ENDPOINTS
===================================================

Use cinematic vocabulary in route names where it improves clarity
without breaking REST conventions.

AUTH
- POST /api/auth/register          # name, email, password → 201 + JWT
- POST /api/auth/login             # email, password → 200 + JWT
- POST /api/auth/logout            # invalidate refresh token
- POST /api/auth/refresh           # rotate access token
- GET  /api/auth/me                # current user profile

ITEMS
- GET  /api/items                   # list with filters (?type, ?genre, ?origin)
- GET  /api/items/:id               # item detail
- GET  /api/items/search?q=         # full-text search across all 3 domains
- GET  /api/items/lens/:lens        # /movies | /music | /books → returns recs
                                     # in that domain for the user (uses
                                     # discovery lens concept from frontend)
- GET  /api/items/:id/cross-domain  # the killer feature — returns items
                                     # from the OTHER TWO domains based
                                     # on this item's metadata

RATINGS
- POST /api/ratings                 # user rates item (1-5, half-star ok)
- PUT  /api/ratings/:id             # update existing rating
- DELETE /api/ratings/:id          # delete rating
- GET  /api/ratings/mine            # user's rating history
- POST /api/ratings/:id/not-interested  # negative signal (separate from rating)

RECOMMENDATIONS
- GET  /api/recommendations                    # main dashboard recs
                                                # (Tonight's Recommendations)
- GET  /api/recommendations/cross-domain       # cross-domain candidates
- POST /api/recommendations/refresh            # trigger recalc (uses 1 credit)
- GET  /api/recommendations/:id/explain        # "Because you liked X" reason
- POST /api/recommendations/:id/feedback       # clicked / dismissed / rated

ONBOARDING
- POST /api/onboarding/survey        # submit 4-step survey → seed preferences

WISHLIST
- GET  /api/wishlist                 # user's wishlist
- POST /api/wishlist/:item_id        # add to wishlist
- DELETE /api/wishlist/:item_id      # remove from wishlist

CREDITS
- GET  /api/credits/balance          # current balance (mono number)
- GET  /api/credits/history          # transaction log
- POST /api/credits/purchase         # MOCK only — flag as prototype in code
- POST /api/credits/reward            # internal: award credits for ratings

ETHIOPIAN CONTENT
- GET  /api/ethiopian                 # Ethiopian content landing data
- GET  /api/ethiopian/:type           # amharic-literature | film | music
- GET  /api/ethiopian/featured        # featured creators

ADMIN (RBAC protected)
- GET  /api/admin/users              # list + suspend/activate
- POST /api/admin/content            # add new item (with Ethiopian flag toggle)
- PUT  /api/admin/content/:id
- GET  /api/admin/analytics
- GET  /api/admin/logs

RESPONSE FORMAT (consistent)
{
  "data": ...,
  "meta": { "credits_remaining": 47, "calibrated_at": "2026-..." },
  "errors": []
}

Use HTTP status codes correctly. Errors return:
{ "error": { "code": "...", "message": "...", "details": {...} } }

===================================================
3. RECOMMENDATION ENGINE (the AI core)
===================================================

This is the most important section. Implement carefully.

PIPELINE (matches the mental model from the project Q&A doc)

  User signals (ratings + onboarding prefs + Ethiopian flag)
       ↓
  Content signal (TF-IDF vectors from genre + description)
       ↓
  Behavior signal (user-user collaborative filtering from shared ratings)
       ↓
  Hybrid scoring (50/50 blend when both available)
       ↓
  Cultural signal (1.3x Ethiopian boost if user opted in)
       ↓
  Cross-domain logic (map book genres → movie/music genres)
       ↓
  Ranking + explanation generation
       ↓
  Personalized recommendations

3.1 CONTENT-BASED (TF-IDF + cosine similarity)
- For each item, build feature_text = genre + first 200 chars of description
  (matches the project's documented behavior)
- Fit TfidfVectorizer on the full item catalog
- Persist the vectorizer (joblib) — refit when items added
- Store vectors in Supabase using pgvector:
    ALTER TABLE item_vectors ADD COLUMN embedding vector(384);
  (or whatever dimension your TF-IDF produces)
- For similarity queries, use pgvector's <=> operator (cosine distance):
    SELECT item_id, 1 - (embedding <=> :query_vec) AS similarity
    FROM item_vectors
    WHERE item_id != :excluded_id
    ORDER BY embedding <=> :query_vec
    LIMIT 10;
- DO NOT load the entire item matrix into memory for every request.
  Use pgvector queries — that's why we chose Supabase.

3.2 COLLABORATIVE FILTERING (user-user)
- Build user-item rating matrix on demand (or cache in Redis for 1h)
- Compute user-user cosine similarity using shared ratings only
- For target user, find top-K nearest neighbors (K=20)
- Aggregate their highly-rated items the target hasn't seen
- Score = sum(neighbor_similarity * neighbor_rating) / sum(neighbor_similarity)
- COLD START: if user has <5 ratings, fall back to:
  - Onboarding preference matches (3.4 below)
  - Otherwise: popular + highly-rated items

3.3 HYBRID SCORING (50/50)
- Normalize both scores to [0, 1]
- final_score = 0.5 * content_score + 0.5 * collab_score
- If only one signal available (e.g., new user), use that one alone
  and log the missing signal for monitoring
- DO NOT claim "dynamic blending" — the Q&A doc is explicit: 50/50

3.4 COLD START / ONBOARDING SEEDING
- When user submits onboarding survey:
  - Convert genre selections into preference rows with weight=0.8
  - Map to content-based vectors with high default weight
  - Find nearest-neighbor cluster of users with similar preferences
  - Use their aggregate favorites as initial recommendations
- Until user has 5+ ratings, ALWAYS blend survey-seeded prefs into scoring

3.5 CROSS-DOMAIN RECOMMENDATION
- Define a genre-mapping table (the project doc includes this):
    Book Romance → Movie Romantic Comedy → Music Love Songs / Soft Pop
    Book Sci-Fi → Movie Sci-Fi → Music Electronic / Synth
    Book Fantasy → Movie Fantasy/Adventure → Music Orchestral / Soundtrack
    Book Drama → Movie Drama → Music Emotional Ballads / Blues
    Book Thriller → Movie Thriller/Suspense → Music Rock / Intense
- When user has strong preference in domain A, surface cross-domain
  candidates using the mapping
- Cross-domain recs are visually distinct on frontend (violet halo accent)
- API endpoint: GET /api/items/:id/cross-domain returns these

3.6 ETHIOPIAN CULTURAL BOOST (1.3x)
- If user has ethiopian_preference = true (set during onboarding or profile)
- Multiply final_score by 1.3 for items where ethiopian_metadata.is_traditional = true
- This is a RANKING preference, not a quality claim
- Document this clearly in code comments (per the Q&A defense doc)

3.7 EXPLANATION GENERATION
- For each recommendation, generate a human-readable reason:
    "Because you rated {item} 5 stars" → content-based
    "People with similar taste liked this" → collaborative
    "Cross-domain match from your {domain} preferences" → cross-domain
    "Featured Ethiopian content matching your cultural preference" → cultural
- Store explanations alongside recommendations in the recommendations table

3.8 CACHING + INVALIDATION
- Cache personalized recs in Supabase `recommendations` table with expires_at
- TTL: 24h or until user submits a new rating (whichever first)
- On rating submit: invalidate that user's recs asynchronously
- DO NOT recompute recs on every dashboard load

3.9 EVALUATION (future, but stub now)
- Stub functions for Precision@K, Recall@K, NDCG
- Document that production evaluation requires A/B testing + feedback volume
- Honest answer per Q&A doc: "Not yet at production scale. Next steps."

===================================================
4. AUTH + SECURITY
===================================================

- Password hashing: bcrypt with 12 salt rounds (NEVER store plaintext)
- JWT: access token (15min) + refresh token (7 days, http-only cookie)
- Rate limit /api/auth/login: 5 attempts per 15min per IP
- Rate limit /api/recommendations/refresh: 10 per hour per user
- Input validation on every endpoint (Pydantic schemas)
- SQL injection: SQLAlchemy ORM only, no raw SQL except pgvector queries
  (and those use parameterized vectors)
- XSS: bleach-sanitize any user-generated text (reviews, notes)
- CORS: restrict to frontend domain in production
- Secrets: never in code, always env vars
- Admin role: created manually, not via registration
- Audit log every admin action with timestamp + IP

===================================================
5. EXTERNAL API INTEGRATIONS
===================================================

TMDB (movies), Spotify (music), Google Books (books)
- Each client class isolates its API
- Cache responses in `api_cache` table (TTL 7d)
- Handle rate limits gracefully (back off + use cache)
- Never block the main request flow — if external fetch fails, use cached
- Background job (cron or Celery) refreshes popular content weekly

===================================================
6. CODE NAMING (cinematic voice pack)
===================================================

Use cinematic vocabulary in module + function names where it improves
the conceptual model without being precious:
- "calibrate_user_taste()" instead of "generate_recommendations()"
- "screening_queue" for admin content review queue
- "cross_domain_match" instead of "similar_items"
- "cultural_boost" instead of "ethiopian_multiplier"
- "tonights_recommendations" instead of "daily_picks"

But: DB table names stay standard (users, items, ratings) for clarity.
Cinematic naming is for code logic, not data layer.

===================================================
7. ERROR HANDLING + LOGGING
===================================================

- Custom exception classes: NotFoundError, ValidationError, AuthError, CreditError
- Global error handler returns consistent JSON error format
- Structured logging (JSON) — include request_id, user_id, endpoint
- Recommendation engine failures: fall back to cached recs, log alert
- External API failures: use cache, log warning, don't crash
- 5xx errors: log full traceback, return generic message to user

===================================================
8. TESTING
===================================================

- Unit tests for every rec_engine module (TF-IDF, CF, hybrid, cold-start)
- Integration tests for every API endpoint
- Test fixtures: sample users, items, ratings, ethiopian content
- Test cold-start path explicitly
- Test cross-domain mapping explicitly
- Test 1.3x cultural boost application
- Test credit deduction on rec refresh
- pytest + pytest-cov, target 80% coverage on rec_engine
```
