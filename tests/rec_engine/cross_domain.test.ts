// EthioReco — Cross-Domain Mapping Tests
import { describe, it, expect } from "bun:test";
import {
  CROSS_DOMAIN_MAP,
  mapCrossDomain,
  findSourceGenresForTargetGenre,
} from "@/rec_engine/cross_domain";

describe("cross-domain mapping", () => {
  it("includes the spec mappings (Romance, Sci-Fi, Fantasy, Drama, Thriller)", () => {
    expect(CROSS_DOMAIN_MAP["romance"]).toBeDefined();
    expect(CROSS_DOMAIN_MAP["sci-fi"]).toBeDefined();
    expect(CROSS_DOMAIN_MAP["fantasy"]).toBeDefined();
    expect(CROSS_DOMAIN_MAP["drama"]).toBeDefined();
    expect(CROSS_DOMAIN_MAP["thriller"]).toBeDefined();
  });

  it("includes Ethiopian genre bridges (Tizita, Bati)", () => {
    expect(CROSS_DOMAIN_MAP["tizita"]).toBeDefined();
    expect(CROSS_DOMAIN_MAP["bati"]).toBeDefined();
  });
});

describe("mapCrossDomain", () => {
  it("maps Romance book to Romantic Comedy movie + Love Songs music", () => {
    expect(mapCrossDomain("romance", "movie")).toContain("Romantic Comedy");
    expect(mapCrossDomain("romance", "music")).toContain("Love Songs");
  });

  it("maps Sci-Fi to Electronic music", () => {
    expect(mapCrossDomain("sci-fi", "music")).toContain("Electronic");
  });

  it("maps Fantasy to Orchestral music", () => {
    expect(mapCrossDomain("fantasy", "music")).toContain("Orchestral");
  });

  it("maps Thriller to Rock music", () => {
    expect(mapCrossDomain("thriller", "music")).toContain("Rock");
  });

  it("maps Tizita to itself (preserves traditional kiñit)", () => {
    expect(mapCrossDomain("tizita", "music")).toContain("Tizita");
  });

  it("is case-insensitive on the source genre", () => {
    expect(mapCrossDomain("ROMANCE", "movie")).toContain("Romantic Comedy");
    expect(mapCrossDomain("Sci-Fi", "music")).toContain("Electronic");
  });

  it("returns empty array for unmapped genres", () => {
    expect(mapCrossDomain("nonexistent-genre", "movie")).toEqual([]);
  });
});

describe("findSourceGenresForTargetGenre (reverse lookup)", () => {
  it("finds Romance as a source for Romantic Comedy", () => {
    expect(findSourceGenresForTargetGenre("movie", "Romantic Comedy")).toContain("romance");
  });

  it("returns empty array for genres with no source", () => {
    expect(findSourceGenresForTargetGenre("movie", "Unmapped")).toEqual([]);
  });
});
