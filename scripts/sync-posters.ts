// EthioReco — Poster Sync Script
// Fetches REAL movie posters from TMDB + book covers from Google Books
// Updates existing items in the database with real cover image URLs.
//
// Usage:
//   TMDB_API_KEY=your_key bun scripts/sync-posters.ts
//
// Or set TMDB_API_KEY in your .env file first.

import { db } from "../src/lib/db";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const GB_BASE = "https://www.googleapis.com/books/v1";

interface TMDBSearchResponse {
  results?: Array<{
    id: number;
    title: string;
    poster_path: string | null;
    release_date?: string;
    overview?: string;
    vote_average?: number;
    vote_count?: number;
  }>;
}

interface GBVolume {
  id: string;
  volumeInfo: {
    title?: string;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  };
}

interface GBSearchResponse {
  items?: GBVolume[];
}

async function searchTMDB(title: string, year?: number | null): Promise<{ posterUrl: string | null; tmdbId: string | null }> {
  if (!process.env.TMDB_API_KEY) return { posterUrl: null, tmdbId: null };
  try {
    // Support BOTH v3 API key (32-char hex) AND v4 Read Access Token (JWT)
    // v3 keys use ?api_key= query param, v4 tokens use Bearer header
    const key = process.env.TMDB_API_KEY;
    const isV4 = key.startsWith("eyJ") && key.length > 100;
    const baseUrl = `${TMDB_BASE}/search/movie?query=${encodeURIComponent(title)}&language=en-US&page=1&include_adult=false`;
    const url = isV4
      ? baseUrl
      : `${baseUrl}&api_key=${key}`;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (isV4) {
      headers.Authorization = `Bearer ${key}`;
    }
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.warn(`  TMDB ${res.status} for "${title}"`);
      return { posterUrl: null, tmdbId: null };
    }
    const data = (await res.json()) as TMDBSearchResponse;
    if (!data.results || data.results.length === 0) return { posterUrl: null, tmdbId: null };
    // Prefer result matching release year if provided
    let best = data.results[0];
    if (year) {
      const yearMatch = data.results.find((r) => r.release_date?.startsWith(String(year)));
      if (yearMatch) best = yearMatch;
    }
    return {
      posterUrl: best.poster_path ? `${TMDB_IMG}${best.poster_path}` : null,
      tmdbId: String(best.id),
    };
  } catch (err) {
    console.warn(`  TMDB error for "${title}":`, err);
    return { posterUrl: null, tmdbId: null };
  }
}

async function searchGoogleBooks(title: string, author?: string | null): Promise<string | null> {
  // Try up to 3 times with backoff — Google Books has a 100 req/min rate limit,
  // and from a shared IP you might hit quota. Each retry waits longer.
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const query = author ? `${title} ${author}` : title;
      const url = `${GB_BASE}/volumes?q=${encodeURIComponent(query)}&maxResults=3&printType=books`;
      const res = await fetch(url);
      if (res.status === 429) {
        // Rate limited — wait and retry
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 2000 * attempt));
          continue;
        }
        console.warn(`  Google Books rate-limited for "${title}" (quota exhausted)`);
        return null;
      }
      if (!res.ok) return null;
      const data = (await res.json()) as GBSearchResponse;
      if (!data.items || data.items.length === 0) return null;
      // Pick first result that has an image
      for (const item of data.items) {
        const img = item.volumeInfo.imageLinks?.thumbnail ?? item.volumeInfo.imageLinks?.smallThumbnail;
        if (img) return img.replace("http:", "https:"); // force https
      }
      return null;
    } catch (err) {
      console.warn(`  Google Books error for "${title}" (attempt ${attempt}):`, err);
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 1500 * attempt));
        continue;
      }
      return null;
    }
  }
  return null;
}

async function syncPosters() {
  console.log("EthioReco — Poster Sync");
  console.log("========================");

  const hasTMDB = !!process.env.TMDB_API_KEY;
  console.log(`TMDB API: ${hasTMDB ? "configured ✓" : "NOT configured (movie posters will be skipped)"}`);
  console.log(`Google Books API: always available (no key required)`);
  console.log("");

  const items = await db.item.findMany({
    where: { status: "active" },
    select: {
      id: true, title: true, type: true, releaseYear: true,
      author: true, coverImageUrl: true, externalSource: true,
      ethiopianMetadata: { select: { amharicTitle: true, isTraditional: true } },
    },
  });

  console.log(`Found ${items.length} items to process.`);
  console.log("");

  let updated = 0;
  let skipped = 0;
  let noMatch = 0;

  // Throttle to avoid rate limits (TMDB ~50 req/s, Google Books ~100 req/min)
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    // Skip if already has a real poster (not the picsum.photos placeholder)
    if (it.coverImageUrl && !it.coverImageUrl.includes("picsum.photos")) {
      skipped++;
      continue;
    }
    process.stdout.write(`[${i + 1}/${items.length}] ${it.type}: ${it.title}... `);

    let newUrl: string | null = null;
    let externalId: string | null = null;
    let externalSource: string | null = null;

    if (it.type === "movie") {
      // Use TMDB if available, else skip (we don't want random posters)
      if (hasTMDB) {
        const result = await searchTMDB(it.title, it.releaseYear);
        if (result.posterUrl) {
          newUrl = result.posterUrl;
          externalId = result.tmdbId;
          externalSource = "tmdb";
        }
      } else {
        console.log("skip (no TMDB key)");
        noMatch++;
        continue;
      }
    } else if (it.type === "book") {
      // Skip Ethiopian books — Google Books doesn't have them
      if (it.ethiopianMetadata) {
        console.log("skip (Ethiopian book — likely not in Google Books)");
        noMatch++;
        continue;
      }
      const url = await searchGoogleBooks(it.title, it.author);
      if (url) {
        newUrl = url;
        externalSource = "google_books";
      }
    } else if (it.type === "music") {
      // Skip music — we don't have a Spotify client set up here, and picsum
      // is okay for music since album art is harder to fetch without keys
      console.log("skip (music — needs Spotify integration, skipping)");
      noMatch++;
      continue;
    }

    if (newUrl) {
      await db.item.update({
        where: { id: it.id },
        data: {
          coverImageUrl: newUrl,
          externalId: externalId,
          externalSource: externalSource ?? it.externalSource,
        },
      });
      updated++;
      console.log("✓ updated");
    } else {
      noMatch++;
      console.log("✗ no match found");
    }

    // Throttle: 100ms between requests
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log("");
  console.log("Summary:");
  console.log(`  ✓ Updated with real posters: ${updated}`);
  console.log(`  ⊘ Already had real posters (skipped): ${skipped}`);
  console.log(`  ✗ No match found (kept placeholder): ${noMatch}`);
  console.log("");
  console.log("Done. Vercel will pick up the changes — your items now have real posters.");
  process.exit(0);
}

syncPosters().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
