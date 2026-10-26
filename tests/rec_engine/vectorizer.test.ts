// EthioReco — TF-IDF + Cosine Similarity Tests
// Run with: bun test tests/rec_engine/vectorizer.test.ts
// (or: bun run vitest --prefix tests/rec_engine)

import { describe, it, expect } from "bun:test";
import {
  tokenize,
  buildFeatureText,
  fitVectorizer,
  transformVector,
  cosineSimilarity,
  serializeVector,
  deserializeVector,
} from "@/rec_engine/vectorizer";

describe("tokenizer", () => {
  it("lowercases and strips punctuation", () => {
    const t = tokenize("Hello, WORLD! Foo-bar.");
    expect(t).toEqual(["hello", "world", "foo", "bar"]);
  });

  it("drops stopwords and 1-char tokens", () => {
    const t = tokenize("the a an in on at science fiction");
    expect(t).toEqual(["science", "fiction"]);
  });

  it("returns empty array on empty input", () => {
    expect(tokenize("")).toEqual([]);
    expect(tokenize("the a an")).toEqual([]);
  });
});

describe("buildFeatureText", () => {
  it("concatenates type + genre + title + first 200 chars of description", () => {
    const longDesc = "x".repeat(300);
    const txt = buildFeatureText({
      type: "book",
      genre: "Sci-Fi",
      title: "Dune",
      description: longDesc,
    });
    expect(txt).toContain("book");
    expect(txt).toContain("Sci-Fi");
    expect(txt).toContain("Dune");
    // Description truncated to 200 chars (the x's should be capped at 200)
    const descPart = "x".repeat(200);
    expect(txt).toContain(descPart);
    // And no more than 200 x's
    const tooLong = "x".repeat(201);
    expect(txt).not.toContain(tooLong);
  });

  it("handles missing fields gracefully", () => {
    expect(buildFeatureText({})).toBe("");
    expect(buildFeatureText({ genre: "Drama" })).toBe("Drama");
    expect(buildFeatureText({ genre: "Sci-Fi / Thriller", description: "x" })).toBe("Sci-Fi Thriller x");
  });
});

describe("fitVectorizer + transformVector", () => {
  it("builds vocabulary from corpus", () => {
    const v = fitVectorizer(["foo bar", "bar baz"]);
    expect(v.featureCount).toBe(3);
    expect(v.vocabulary.has("foo")).toBe(true);
    expect(v.vocabulary.has("bar")).toBe(true);
    expect(v.vocabulary.has("baz")).toBe(true);
  });

  it("computes smooth IDF (sklearn-default formula)", () => {
    const v = fitVectorizer(["foo", "foo", "foo"]); // same term in all docs
    // IDF = ln((1+3)/(1+3)) + 1 = 0 + 1 = 1
    expect(v.idf[0]).toBeCloseTo(1, 5);
  });

  it("L2-normalizes the resulting vector", () => {
    const v = fitVectorizer(["foo bar baz"]);
    const vec = transformVector("foo bar baz", v);
    let norm = 0;
    for (const val of vec.values()) norm += val * val;
    expect(Math.sqrt(norm)).toBeCloseTo(1, 5);
  });

  it("returns empty vector for unseen tokens", () => {
    const v = fitVectorizer(["foo bar"]);
    const vec = transformVector("unseen-term", v);
    expect(vec.size).toBe(0);
  });
});

describe("cosineSimilarity", () => {
  it("returns 1 for identical L2-normalized vectors", () => {
    const v = fitVectorizer(["foo bar baz"]);
    const a = transformVector("foo bar baz", v);
    const b = transformVector("foo bar baz", v);
    expect(cosineSimilarity(a, b)).toBeCloseTo(1, 5);
  });

  it("returns 0 for disjoint vectors", () => {
    const v = fitVectorizer(["foo", "bar"]);
    const a = transformVector("foo", v);
    const b = transformVector("bar", v);
    expect(cosineSimilarity(a, b)).toBeCloseTo(0, 5);
  });

  it("returns partial similarity for overlapping vectors", () => {
    const v = fitVectorizer(["foo bar", "bar baz"]);
    const a = transformVector("foo bar", v);
    const b = transformVector("bar baz", v);
    const sim = cosineSimilarity(a, b);
    expect(sim).toBeGreaterThan(0);
    expect(sim).toBeLessThan(1);
  });
});

describe("serializeVector / deserializeVector", () => {
  it("round-trips vectors through JSON", () => {
    const v = fitVectorizer(["foo bar baz"]);
    const vec = transformVector("foo bar baz", v);
    const s = serializeVector(vec);
    const restored = deserializeVector(s);
    expect(restored.size).toBe(vec.size);
    for (const [k, val] of vec) {
      expect(restored.get(k)).toBeCloseTo(val, 5);
    }
  });
});
