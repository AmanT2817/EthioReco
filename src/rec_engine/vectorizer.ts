// EthioReco — TF-IDF Vectorizer (ports scikit-learn TfidfVectorizer to TypeScript)
// Cinematic Discovery • No external ML libs needed

export interface TokenizedDoc {
  tokens: string[];
  featureText: string;
}

const STOPWORDS = new Set([
  "the","a","an","and","or","but","is","are","was","were","be","been","being",
  "have","has","had","do","does","did","will","would","could","should","may",
  "might","must","can","this","that","these","those","i","you","he","she","it",
  "we","they","what","which","who","when","where","why","how","all","any","both",
  "each","few","more","most","other","some","such","no","nor","not","only","own",
  "same","so","than","too","very","s","t","just","don","now","in","on","at","to",
  "for","of","with","by","from","about","as","into","through","during","before",
  "after","above","below","up","down","out","off","over","under","again","further",
  "then","once","here","there","film","movie","book","music","album","song","story",
]);

// Tokenize + lowercase + strip punctuation, drop stopwords + 1-char tokens
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

// Build feature text per spec: genre + first 200 chars of description
export function buildFeatureText(opts: {
  genre?: string | null;
  description?: string | null;
  title?: string | null;
  type?: string | null;
}): string {
  const parts: string[] = [];
  if (opts.type) parts.push(opts.type);
  if (opts.genre) parts.push(...opts.genre.split(/[\/,|]/).map((g) => g.trim()).filter(Boolean));
  if (opts.title) parts.push(opts.title);
  if (opts.description) parts.push(opts.description.slice(0, 200));
  return parts.join(" ").trim();
}

export interface FittedVectorizer {
  vocabulary: Map<string, number>;
  idf: number[];
  featureCount: number;
}

// Fit IDF over a corpus
export function fitVectorizer(corpus: string[]): FittedVectorizer {
  const docCount = corpus.length;
  const df = new Map<string, number>();
  for (const doc of corpus) {
    const seen = new Set<string>();
    for (const tok of tokenize(doc)) {
      if (!seen.has(tok)) {
        seen.add(tok);
        df.set(tok, (df.get(tok) ?? 0) + 1);
      }
    }
  }
  // sort vocab deterministically
  const sortedTerms = Array.from(df.keys()).sort();
  const vocabulary = new Map<string, number>();
  sortedTerms.forEach((term, i) => vocabulary.set(term, i));
  // IDF: ln((1 + n) / (1 + df)) + 1 (smooth IDF — sklearn default)
  const idf = sortedTerms.map((term) => Math.log((1 + docCount) / (1 + (df.get(term) ?? 0))) + 1);
  return { vocabulary, idf, featureCount: sortedTerms.length };
}

// Transform a single doc to a sparse TF-IDF vector (Map<index, weight>)
export function transformVector(doc: string, fitted: FittedVectorizer): Map<number, number> {
  const tokens = tokenize(doc);
  const tf = new Map<number, number>();
  for (const tok of tokens) {
    const idx = fitted.vocabulary.get(tok);
    if (idx === undefined) continue;
    tf.set(idx, (tf.get(idx) ?? 0) + 1);
  }
  // L2-normalize
  let sum = 0;
  for (const v of tf.values()) sum += v * v;
  const norm = Math.sqrt(sum) || 1;
  const out = new Map<number, number>();
  for (const [idx, count] of tf) {
    out.set(idx, (count / norm) * fitted.idf[idx]);
  }
  return out;
}

// Cosine similarity between two sparse vectors
export function cosineSimilarity(a: Map<number, number>, b: Map<number, number>): number {
  let dot = 0;
  const [small, large] = a.size < b.size ? [a, b] : [b, a];
  for (const [idx, val] of small) {
    const other = large.get(idx);
    if (other !== undefined) dot += val * other;
  }
  // Both vectors are already L2-normalized → dot == cosine
  return dot;
}

// Persist/restore vectors as plain arrays for storage
export function serializeVector(v: Map<number, number>): string {
  return JSON.stringify(Array.from(v.entries()));
}

export function deserializeVector(s: string): Map<number, number> {
  const arr: [number, number][] = JSON.parse(s);
  return new Map(arr);
}
