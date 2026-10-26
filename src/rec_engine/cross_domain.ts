// EthioReco — Cross-Domain Mapping
// Maps user's strong preferences in one domain to candidate genres in the others.

// The Q&A doc defines these mappings explicitly
export const CROSS_DOMAIN_MAP: Record<
  string, // source book genre
  { movie: string[]; music: string[] }
> = {
  romance: {
    movie: ["Romantic Comedy", "Romance", "Drama"],
    music: ["Love Songs", "Soft Pop", "Ballad"],
  },
  "sci-fi": {
    movie: ["Sci-Fi", "Science Fiction"],
    music: ["Electronic", "Synth", "Ambient"],
  },
  fantasy: {
    movie: ["Fantasy", "Adventure"],
    music: ["Orchestral", "Soundtrack", "Instrumental"],
  },
  drama: {
    movie: ["Drama"],
    music: ["Emotional Ballads", "Blues", "Soul"],
  },
  thriller: {
    movie: ["Thriller", "Suspense"],
    music: ["Rock", "Intense", "Alternative"],
  },
  comedy: {
    movie: ["Comedy"],
    music: ["Pop", "Funk", "Upbeat"],
  },
  horror: {
    movie: ["Horror"],
    music: ["Dark Ambient", "Metal", "Industrial"],
  },
  mystery: {
    movie: ["Mystery", "Crime"],
    music: ["Jazz", "Noir", "Ambient"],
  },
  "historical fiction": {
    movie: ["Historical", "Period Drama"],
    music: ["Folk", "Classical", "World"],
  },
  // Ethiopian genre bridges
  tizita: {
    movie: ["Drama", "Romance"],
    music: ["Tizita", "Ballad"],
  },
  bati: {
    movie: ["Drama"],
    music: ["Bati", "Folk"],
  },
};

// Reverse-lookup helper: given a target domain's genre, what source genres might map to it?
export function findSourceGenresForTargetGenre(
  targetDomain: "movie" | "music",
  targetGenre: string,
): string[] {
  const matches: string[] = [];
  for (const [sourceGenre, targets] of Object.entries(CROSS_DOMAIN_MAP)) {
    const targetList = targets[targetDomain];
    if (targetList.some((g) => g.toLowerCase() === targetGenre.toLowerCase())) {
      matches.push(sourceGenre);
    }
  }
  return matches;
}

// Given a user's strong genres in domain A, return target genres in domain B
export function mapCrossDomain(
  sourceGenre: string,
  targetDomain: "movie" | "music",
): string[] {
  const key = sourceGenre.toLowerCase().trim();
  return CROSS_DOMAIN_MAP[key]?.[targetDomain] ?? [];
}
