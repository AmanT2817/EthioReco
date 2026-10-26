// EthioReco — External API clients barrel export
import { tmdbClient } from "./tmdb_client";
import { spotifyClient } from "./spotify_client";
import { googleBooksClient } from "./google_books_client";

export { tmdbClient, type NormalizedMovie } from "./tmdb_client";
export { spotifyClient, type NormalizedTrack } from "./spotify_client";
export { googleBooksClient, type NormalizedBook } from "./google_books_client";

// Unified search dispatcher — routes by content type
export type ExternalType = "movie" | "music" | "book";

export async function searchExternal(
  type: ExternalType,
  query: string,
): Promise<Array<Record<string, unknown>>> {
  switch (type) {
    case "movie":
      return (await tmdbClient.searchMovies(query)) as unknown as Array<Record<string, unknown>>;
    case "music":
      return (await spotifyClient.searchTracks(query)) as unknown as Array<Record<string, unknown>>;
    case "book":
      return (await googleBooksClient.searchBooks(query)) as unknown as Array<Record<string, unknown>>;
    default:
      return [];
  }
}

// Status check — are external APIs configured?
export function externalStatus() {
  return {
    tmdb: tmdbClient.isConfigured(),
    spotify: spotifyClient.isConfigured(),
    googleBooks: googleBooksClient.isConfigured(),
  };
}
