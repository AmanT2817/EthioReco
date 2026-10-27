// EthioReco — TMDB Client (movies)
// External API integration with response caching + graceful fallback
// when TMDB_API_KEY is not set.

import { db } from "@/lib/db";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days per spec

interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  genre_ids: number[];
  poster_path: string | null;
  vote_average: number;
  vote_count: number;
  original_language: string;
  origin_country?: string[];
}

interface TMDBGenre {
  id: number;
  name: string;
}

// Standard TMDB genre IDs → readable genre names (subset)
const TMDB_GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

export interface NormalizedMovie {
  title: string;
  description: string;
  releaseYear: number | null;
  language: string | null;
  country: string | null;
  coverImageUrl: string | null;
  director: string | null;
  genre: string;
  externalId: string;
  externalSource: "tmdb";
  averageRating: number;
  ratingCount: number;
}

function isConfigured(): boolean {
  return !!process.env.TMDB_API_KEY;
}

// Detect TMDB key format — supports BOTH v3 (32-char hex) and v4 (JWT bearer token)
// v3 keys look like: "0f5d3d2056b3a0c9b8a58cd3f189c105" (32 hex chars)
// v4 keys look like: "eyJhbGciOi..." (~500 chars, JWT format starting with "eyJ")
function isV4Token(key: string): boolean {
  return key.startsWith("eyJ") && key.length > 100;
}

// Build the proper URL with auth — v3 uses ?api_key= query param, v4 uses Bearer header
function buildAuthedUrl(url: string): { url: string; headers: Record<string, string> } {
  const key = process.env.TMDB_API_KEY!;
  if (isV4Token(key)) {
    // v4 Read Access Token (Bearer)
    return {
      url,
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
    };
  }
  // v3 API key — append as query param
  const sep = url.includes("?") ? "&" : "?";
  return {
    url: `${url}${sep}api_key=${key}`,
    headers: { Accept: "application/json" },
  };
}

// Read-through cache — get a cached response or fetch + cache it
async function cachedFetch<T>(cacheKey: string, url: string): Promise<T | null> {
  // Check DB cache first
  const cached = await db.apiCache.findUnique({ where: { cacheKey } });
  if (cached && cached.expiresAt > new Date()) {
    try {
      return JSON.parse(cached.response) as T;
    } catch {
      // Bad cache — fall through
    }
  }
  // Live fetch
  if (!isConfigured()) return null;
  try {
    const { url: authedUrl, headers } = buildAuthedUrl(url);
    const res = await fetch(authedUrl, {
      headers,
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      console.warn(`TMDB ${res.status} for ${url}`);
      return null;
    }
    const json = await res.json() as T;
    // Cache it
    await db.apiCache.upsert({
      where: { cacheKey },
      create: {
        cacheKey,
        source: "tmdb",
        response: JSON.stringify(json),
        expiresAt: new Date(Date.now() + CACHE_TTL_MS),
      },
      update: {
        response: JSON.stringify(json),
        expiresAt: new Date(Date.now() + CACHE_TTL_MS),
      },
    });
    return json;
  } catch (err) {
    console.warn(`TMDB fetch error for ${url}:`, err);
    return null;
  }
}

interface TMDBSearchResponse {
  results: TMDBMovie[];
  total_results: number;
  page: number;
}

// Search TMDB for movies
export async function searchMovies(query: string): Promise<NormalizedMovie[]> {
  const cacheKey = `tmdb:search:${query}`;
  const data = await cachedFetch<TMDBSearchResponse>(
    cacheKey,
    `${TMDB_BASE}/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=1`,
  );
  if (!data?.results) return [];
  return data.results
    .filter((m) => m.title && m.overview)
    .slice(0, 10)
    .map((m) => normalizeTMDBMovie(m));
}

// Get top popular movies (for "trending" imports)
export async function getPopularMovies(): Promise<NormalizedMovie[]> {
  const cacheKey = "tmdb:popular:movies";
  const data = await cachedFetch<TMDBSearchResponse>(
    cacheKey,
    `${TMDB_BASE}/movie/popular?language=en-US&page=1`,
  );
  if (!data?.results) return [];
  return data.results.slice(0, 12).map((m) => normalizeTMDBMovie(m));
}

function normalizeTMDBMovie(m: TMDBMovie): NormalizedMovie {
  const genres = m.genre_ids
    .map((id) => TMDB_GENRE_MAP[id])
    .filter(Boolean)
    .join(", ");
  return {
    title: m.title,
    description: m.overview ?? "",
    releaseYear: m.release_date ? parseInt(m.release_date.slice(0, 4), 10) : null,
    language: m.original_language ?? null,
    country: m.origin_country?.[0] ?? null,
    coverImageUrl: m.poster_path ? `${TMDB_IMG}${m.poster_path}` : null,
    director: null, // requires a separate /credits call — skip for simplicity
    genre: genres || "Drama",
    externalId: String(m.id),
    externalSource: "tmdb",
    averageRating: m.vote_average ? m.vote_average / 2 : 0, // TMDB is 0-10, normalize to 0-5
    ratingCount: m.vote_count ?? 0,
  };
}

export const tmdbClient = {
  isConfigured,
  searchMovies,
  getPopularMovies,
};
