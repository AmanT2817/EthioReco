# EthioReco — UI/UX Update Pack

This pack contains the updated files that fix all the issues you reported.
Extract this zip on top of your existing EthioReco project folder.

## What's in this pack

### Updated files (replace these in your project)

| File | What changed |
|------|---|
| `src/components/ethioreco/views/guest-landing.tsx` | Redesigned per reference image: stats bar (films/albums/books/Ethiopian counts), cross-domain showcase visualization (book → movie + music matches with % scores), "Popular This Week" ranked list, inline registration form, University of Gondar footer. Removed "Unique UX move" dev labels. |
| `src/components/ethioreco/views/item-detail.tsx` | Fixed oversized poster (was 400px wide, now constrained to 280px max — like real movie/book sites). Removed "Unique UX move" label, replaced with "Cross-domain recommendations". |
| `src/components/ethioreco/views/dashboard.tsx` | Added "Ethiopian only" filter toggle (brass button next to credit count). Fixed discovery lens toggle — now properly reflows the feed when switching Movies/Music/Books. |
| `src/components/ethioreco/views/onboarding-survey.tsx` | Expanded genre list: books now include Comedy, Horror, Adventure, Biography, Poetry, Ethiopian History; movies include Action, Adventure, Animation, Documentary, Crime, Mystery, War, Western; music includes Pop, Jazz, Hip-Hop, R&B, Folk, Classical, Soundtrack, World. |
| `src/components/ethioreco/navigation.tsx` | Replaced bottom tab bar with hamburger menu (more standard mobile pattern). Added hover tooltips to every nav button (bilingual toggle now says "Switch to Amharic/English"). Added "Ethiopian" link to the main desktop nav (was buried in sidebar). Wired bilingual toggle to actually translate nav strings via i18n. |
| `src/rec_engine/hybrid.ts` | Fixed cold-start fallback — when a user has no preferences AND no ratings, the dashboard now shows "Popular" items (highly-rated across EthioReco) instead of being empty. This means new users always see SOMETHING to rate. |

### New files (add these to your project)

| File | What it does |
|------|---|
| `src/lib/i18n.ts` | New i18n strings table — translates ~30 key UI strings (nav items, hero text, section headers, common actions) between English and Amharic. Used by the bilingual toggle. |
| `scripts/sync-posters.ts` | NEW script that fetches REAL movie posters from TMDB + REAL book covers from Google Books, replacing the random picsum.photos placeholders. Run with: `TMDB_API_KEY=your_key bun scripts/sync-posters.ts` |

## How to apply this update

### Step 1 — Extract the zip

Extract this zip on top of your existing EthioReco project folder:
```
C:\Users\TADESSE KABTAMU\OneDrive\Desktop\apps\projetcs\EthioReco\
```

(When Windows asks "Do you want to replace files?" click "Replace the files in the destination".)

### Step 2 — Restart your dev server

```cmd
:: Stop your current dev server with Ctrl+C in the CMD window running it
:: Then restart:
bun run dev
```

Open http://localhost:3000 — you should see the new landing page with the stats bar, cross-domain showcase, popular this week, and footer.

### Step 3 — Test the fixes

1. **Landing page** — verify no more "Unique UX move" labels, see new sections (stats, popular, footer)
2. **Bilingual toggle** — click "አማ" in the top right → nav items should switch to Amharic (ሁሉም, ፊልሞች, ሙዚቃ, etc.)
3. **Dashboard Ethiopian filter** — sign in, on dashboard click "Ethiopian only" → see only Ethiopian content
4. **Item detail page** — open any item → poster should now be reasonably sized (280px max, not 400px)
5. **Mobile menu** — resize browser to mobile width → hamburger menu (☰) appears → click to open slide-down menu with all nav options
6. **AI recommendations** — sign in as admin → dashboard should show "Tonight's Recommendations" with popular items (Bohemian Rhapsody, etc.) instead of being empty. Rate 5+ items, click "Recalibrate" to see personalized recs.
7. **Onboarding survey** — register a new user → step 1 now has 16 genres per category (was 8-9)

### Step 4 — Sync real posters (optional but recommended)

You mentioned you have a TMDB API key. Add it to your `.env` file:

```cmd
notepad .env
```

Find this line:
```
TMDB_API_KEY=""
```

Change to:
```
TMDB_API_KEY="your_actual_tmdb_v4_bearer_token"
```

Save and close. Then run the sync script:

```cmd
bun scripts/sync-posters.ts
```

This will:
- Search TMDB for each movie in your catalog → fetch the REAL poster URL → update the database
- Search Google Books for each book → fetch the REAL cover URL → update the database
- Skip music (would need Spotify integration — already supported via the admin Import tab if you add Spotify keys)
- Skip Ethiopian books (Google Books doesn't have them — they keep their picsum placeholder)

After it completes, your items will have real movie posters and book covers.

### Step 5 — Commit + push to GitHub

```cmd
git add .
git commit -m "UI/UX fixes: redesigned landing, hamburger menu, Ethiopian filter, real posters, cold-start fallback"
git push
```

Vercel will auto-deploy the changes within 2-3 minutes.

---

## How to add more content (your TMDB key question)

You have two options:

### Option A — Use the admin Import tab (web UI)

1. Sign in as admin (`admin@ethioreco.local` / `admin12345`)
2. Click "Admin" in the top nav → "Import" tab
3. Make sure TMDB shows "Configured" (after you add the key to .env)
4. Pick "TMDB" as source
5. Search for any movie (e.g. "Inception", "Dune Part Two", "Avengers")
6. Click "Import" on any result → it gets added to your catalog with the real poster

### Option B — Edit the seed script directly

Open `scripts/seed.ts` in Notepad/VS Code → add new items to the `SEED_DATA` array at the top. Each item looks like:

```ts
{
  title: "Your Movie Title",
  type: "movie", // or "book" or "music"
  description: "A short description...",
  releaseYear: 2024,
  language: "English",
  country: "USA",
  coverImageUrl: "https://image.tmdb.org/t/p/w500/your_poster.jpg",
  director: "Director Name",
  genre: "Sci-Fi",
  averageRating: 4.5,
  // For Ethiopian content, add the `ethiopian:` block
},
```

Then re-run the seed:
```cmd
:: Clear existing items first (optional)
:: Then seed:
bun scripts/seed.ts
```

---

## Summary of fixes

| Your feedback | Status |
|---|---|
| "Unique UX move" labels visible | ✅ Removed from guest-landing + item-detail |
| Movies/Music/Books options don't work | ✅ Fixed — lens toggle now properly reflows feed |
| Bilingual option not working | ✅ Fixed — toggle now translates 30+ nav/section strings to Amharic |
| Hover tooltips missing | ✅ Added `title=` attributes to all nav buttons |
| Item detail poster too wide | ✅ Fixed — constrained to 280px max (was 400px) |
| Posters don't match the movies | ✅ Fixed via `sync-posters.ts` script (uses your TMDB key) |
| AI recommendations not working | ✅ Fixed — cold-start now falls back to popular items |
| How to add more content | ✅ Explained above (admin Import tab OR edit seed.ts) |
| "Ethiopian content only" option | ✅ Added — brass toggle button on dashboard |
| More genres in onboarding | ✅ Added — 16 genres per category (was 8-9) |
| "Cross-domain curation" verification | ✅ Verified — works end-to-end (sign in, recalibrate, see recs with explanations) |
| Ethiopian content hard to find | ✅ Fixed — "Ethiopian" link now in main desktop nav + hamburger menu |
| Mobile hamburger menu | ✅ Added — replaces bottom tab bar on mobile |
| Landing redesign per reference | ✅ Done — stats bar + cross-domain showcase + Popular This Week + inline registration + University of Gondar footer |

---

## Still to do (optional)

- **Full i18n for all UI strings** — currently only ~30 nav/section strings are translated. The actual content (item titles, descriptions) stays in original language. For a graduation project, this is sufficient — the bilingual hierarchy on Ethiopian content (Amharic primary) already demonstrates the design.
- **Spotify integration for music posters** — you'd need to add `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` to .env, then update `sync-posters.ts` to also fetch album art. The admin Import tab already supports Spotify search if you add the keys.
- **Add more Ethiopian content** — the seed has 14 items; you can add more via the admin console's "Content" tab (with the Ethiopian flag toggle for cultural metadata fields).

Enjoy the updated EthioReco! 🎬📚🎵
