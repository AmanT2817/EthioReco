// EthioReco — Spotify Client (music)
// Uses Client Credentials flow (no user auth) — server-to-server.
// Falls back gracefully when SPOTIFY_CLIENT_ID/SECRET are not set.

import { db } from "@/lib/db";

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_URL = "https://api.spotify.com/v1";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[]; release_date: string };
  duration_ms: number;
  track_number: number;
  external_urls: { spotify: string };
  preview_url: string | null;
}

interface SpotifySearchResponse {
  tracks?: {
    items: SpotifyTrack[];
    total: number;
  };
}

export interface NormalizedTrack {
  title: string;
  description: string;
  releaseYear: number | null;
  language: string | null;
  country: string | null;
  coverImageUrl: string | null;
  artist: string;
  album: string;
  durationSec: number | null;
  trackNumber: number | null;
  genre: string;
  externalId: string;
  externalSource: "spotify";
  averageRating: number;
  ratingCount: number;
}

function isConfigured(): boolean {
  return !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
}

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string | null> {
  if (!isConfigured()) return null;
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }
  try {
    const creds = Buffer.from(
      `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
    ).toString("base64");
    const res = await fetch(SPOTIFY_TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${creds}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    if (!res.ok) return null;
    const json = await res.json() as { access_token: string; expires_in: number };
    tokenCache = {
      token: json.access_token,
      expiresAt: Date.now() + (json.expires_in - 60) * 1000,
    };
    return json.access_token;
  } catch {
    return null;
  }
}

async function cachedFetch<T>(cacheKey: string, url: string): Promise<T | null> {
  const cached = await db.apiCache.findUnique({ where: { cacheKey } });
  if (cached && cached.expiresAt > new Date()) {
    try {
      return JSON.parse(cached.response) as T;
    } catch {}
  }
  if (!isConfigured()) return null;
  const token = await getAccessToken();
  if (!token) return null;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const json = await res.json() as T;
    await db.apiCache.upsert({
      where: { cacheKey },
      create: {
        cacheKey,
        source: "spotify",
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

// Genre detection heuristic — Spotify's track endpoint doesn't return genre
// (only artist endpoint does). Fall back to text-matching on artist + album name.
function inferGenre(track: SpotifyTrack): string {
  const txt = `${track.artists[0]?.name ?? ""} ${track.album.name} ${track.name}`.toLowerCase();
  if (/tizita|ethiop|amharic|gondar|addis/.test(txt)) return "Tizita";
  if (/love|heart|romance|wedding/.test(txt)) return "Love Songs";
  if (/rock|metal|guitar|drum/.test(txt)) return "Rock";
  if (/electronic|edm|house|techno|synth/.test(txt)) return "Electronic";
  if (/jazz|saxophone|trumpet|blue/.test(txt)) return "Blues";
  if (/orchestra|symphony|classical|soundtrack/.test(txt)) return "Orchestral";
  if (/ballad|slow|emotional/.test(txt)) return "Emotional Ballads";
  return "Pop";
}

export async function searchTracks(query: string): Promise<NormalizedTrack[]> {
  const cacheKey = `spotify:search:${query}`;
  const data = await cachedFetch<SpotifySearchResponse>(
    cacheKey,
    `${SPOTIFY_API_URL}/search?q=${encodeURIComponent(query)}&type=track&limit=10`,
  );
  if (!data?.tracks?.items) return [];
  return data.tracks.items.map((t) => normalizeSpotifyTrack(t));
}

async function getArtistTopTracks(): Promise<NormalizedTrack[]> {
  // Placeholder for future — Spotify's /artists/{id}/top-tracks requires a known artist ID
  return [];
}

function normalizeSpotifyTrack(t: SpotifyTrack): NormalizedTrack {
  return {
    title: t.name,
    description: `From the album ${t.album.name}${t.preview_url ? " — preview available on Spotify." : "."}`,
    releaseYear: t.album.release_date ? parseInt(t.album.release_date.slice(0, 4), 10) : null,
    language: null,
    country: null,
    coverImageUrl: t.album.images[0]?.url ?? null,
    artist: t.artists[0]?.name ?? "Unknown",
    album: t.album.name,
    durationSec: Math.floor(t.duration_ms / 1000),
    trackNumber: t.track_number ?? null,
    genre: inferGenre(t),
    externalId: t.id,
    externalSource: "spotify",
    averageRating: 0, // Spotify doesn't expose a star rating
    ratingCount: 0,
  };
}

export const spotifyClient = {
  isConfigured,
  searchTracks,
  getArtistTopTracks,
};
