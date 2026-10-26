// EthioReco — Google Books Client
// Public API — no auth key required (rate limit: 100 req/min by IP).

import { db } from "@/lib/db";

const GB_BASE = "https://www.googleapis.com/books/v1";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface GBVolume {
  id: string;
  volumeInfo: {
    title: string;
    subtitle?: string;
    authors?: string[];
    description?: string;
    publishedDate?: string;
    pageCount?: number;
    publisher?: string;
    categories?: string[];
    language?: string;
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
    averageRating?: number;
    ratingsCount?: number;
  };
}

interface GBSearchResponse {
  totalItems: number;
  items?: GBVolume[];
}

export interface NormalizedBook {
  title: string;
  description: string;
  releaseYear: number | null;
  language: string | null;
  country: string | null;
  coverImageUrl: string | null;
  author: string;
  isbn: string | null;
  pages: number | null;
  publisher: string | null;
  genre: string;
  externalId: string;
  externalSource: "google_books";
  averageRating: number;
  ratingCount: number;
}

// Google Books is always configured (no key needed for basic search)
function isConfigured(): boolean {
  return true;
}

async function cachedFetch<T>(cacheKey: string, url: string): Promise<T | null> {
  const cached = await db.apiCache.findUnique({ where: { cacheKey } });
  if (cached && cached.expiresAt > new Date()) {
    try {
      return JSON.parse(cached.response) as T;
    } catch {}
  }
  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const json = await res.json() as T;
    await db.apiCache.upsert({
      where: { cacheKey },
      create: {
        cacheKey,
        source: "google_books",
        response: JSON.stringify(json),
        expiresAt: new Date(Date.now() + CACHE_TTL_MS),
      },
      update: {
        response: JSON.stringify(json),
        expiresAt: new Date(Date.now() + CACHE_TTL_MS),
      },
    });
    return json;
  } catch {
    return null;
  }
}

// Extract ISBN-13 if present in industryIdentifiers
function extractISBN(volume: GBVolume): string | null {
  // Note: industryIdentifiers is on volumeInfo but not in our interface above — fetch dynamically
  const ids = (volume.volumeInfo as any).industryIdentifiers as
    | { type: string; identifier: string }[]
    | undefined;
  if (!ids) return null;
  const isbn13 = ids.find((i) => i.type === "ISBN_13");
  return isbn13?.identifier ?? ids[0]?.identifier ?? null;
}

function normalizeGBBook(v: GBVolume): NormalizedBook {
  const info = v.volumeInfo;
  const title = info.subtitle ? `${info.title}: ${info.subtitle}` : info.title;
  return {
    title,
    description: info.description ?? `A book by ${(info.authors ?? ["Unknown"]).join(", ")}.`,
    releaseYear: info.publishedDate ? parseInt(info.publishedDate.slice(0, 4), 10) : null,
    language: info.language ?? null,
    country: null,
    coverImageUrl: info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? null,
    author: (info.authors ?? ["Unknown"]).join(", "),
    isbn: extractISBN(v),
    pages: info.pageCount ?? null,
    publisher: info.publisher ?? null,
    genre: (info.categories ?? ["General"])[0],
    externalId: v.id,
    externalSource: "google_books",
    averageRating: info.averageRating ?? 0,
    ratingCount: info.ratingsCount ?? 0,
  };
}

export async function searchBooks(query: string): Promise<NormalizedBook[]> {
  const cacheKey = `gb:search:${query}`;
  const data = await cachedFetch<GBSearchResponse>(
    cacheKey,
    `${GB_BASE}/volumes?q=${encodeURIComponent(query)}&maxResults=10&printType=books`,
  );
  if (!data?.items) return [];
  return data.items
    .filter((v) => v.volumeInfo.title && (v.volumeInfo.description || v.volumeInfo.authors))
    .map((v) => normalizeGBBook(v));
}

export const googleBooksClient = {
  isConfigured,
  searchBooks,
};
