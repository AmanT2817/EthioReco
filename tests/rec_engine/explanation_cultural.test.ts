// EthioReco — Cultural Boost + Explanation Generator Tests
import { describe, it, expect } from "bun:test";
import { ETHIOPIAN_BOOST_MULTIPLIER } from "@/rec_engine/cultural_boost";
import { generateExplanation } from "@/rec_engine/explanation";

describe("cultural_boost constants", () => {
  it("applies the 1.3x multiplier per spec", () => {
    expect(ETHIOPIAN_BOOST_MULTIPLIER).toBe(1.3);
  });
});

describe("explanation generator", () => {
  it("generates content-based explanation with seed item + score", () => {
    const e = generateExplanation({
      kind: "content",
      seedItemTitle: "Dune",
      seedItemScore: 5,
    });
    expect(e).toContain("Dune");
    expect(e).toContain("5 star"); // pluralized
  });

  it("singularizes 'star' for 1-star ratings", () => {
    const e = generateExplanation({
      kind: "content",
      seedItemTitle: "Foo",
      seedItemScore: 1,
    });
    expect(e).toContain("1 star"); // not "1 stars"
    expect(e).not.toContain("1 stars");
  });

  it("generates collaborative explanation", () => {
    const e = generateExplanation({ kind: "collab" });
    expect(e).toContain("People with similar taste");
  });

  it("generates hybrid explanation with seed item", () => {
    const e = generateExplanation({
      kind: "hybrid",
      seedItemTitle: "Inception",
    });
    expect(e).toContain("Inception");
    expect(e).toContain("viewers like you");
  });

  it("generates cross-domain explanation with source domain + seed", () => {
    const e = generateExplanation({
      kind: "cross_domain",
      sourceDomain: "book",
      seedItemTitle: "Dune",
    });
    expect(e).toContain("book");
    expect(e).toContain("Dune");
  });

  it("generates cultural explanation with region + traditional genre", () => {
    const e = generateExplanation({
      kind: "cultural",
      culturalRegion: "Gondar",
      traditionalGenre: "Tizita",
    });
    expect(e).toContain("Tizita");
    expect(e).toContain("Gondar");
  });

  it("generates cold-start explanation", () => {
    const e = generateExplanation({ kind: "cold_start" });
    expect(e).toContain("onboarding survey");
  });

  it("generates popular fallback explanation", () => {
    const e = generateExplanation({ kind: "popular" });
    expect(e).toContain("Highly rated");
  });
});
