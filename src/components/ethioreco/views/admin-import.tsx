// EthioReco — Admin Import View
// Search TMDB / Spotify / Google Books and import results into the catalog.
// Shows the live config status of each external API.

"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { externalStatus } from "@/lib/external";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Search, Plus, Check, Film, Music2, BookOpen, Cloud, CloudOff } from "lucide-react";

type Source = "movie" | "music" | "book";

const SOURCES: { id: Source; label: string; api: "tmdb" | "spotify" | "googleBooks"; icon: React.ReactNode }[] = [
  { id: "movie", label: "TMDB", api: "tmdb", icon: <Film className="h-4 w-4" /> },
  { id: "music", label: "Spotify", api: "spotify", icon: <Music2 className="h-4 w-4" /> },
  { id: "book", label: "Google Books", api: "googleBooks", icon: <BookOpen className="h-4 w-4" /> },
];

interface ImportResult {
  title: string;
  description?: string;
  coverImageUrl?: string | null;
  genre?: string;
  releaseYear?: number | null;
  author?: string;
  artist?: string;
  director?: string | null;
  album?: string;
  externalId: string;
  externalSource: string;
  averageRating?: number;
  ratingCount?: number;
  [k: string]: unknown;
}

export function AdminImport() {
  const [source, setSource] = useState<Source>("book"); // Google Books needs no key — best default
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ImportResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<ReturnType<typeof externalStatus> | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [imported, setImported] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Fetch the API config status (call the import endpoint with no q)
    api.searchExternal("book", "").then((r) => {
      setStatus((r.data as any).status);
    }).catch(() => {});
  }, []);

  const handleSearch = async () => {
    if (!q.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      const r = await api.searchExternal(source, q);
      setResults((r.data as any).results ?? []);
    } catch {
      setResults([]);
    }
    setLoading(false);
  };

  const handleImport = async (idx: number) => {
    const item = results[idx];
    if (!item) return;
    const key = `${item.externalSource}:${item.externalId}`;
    setImporting(key);
    try {
      // Construct the insert payload
      const payload: Record<string, unknown> = {
        type: source,
        title: item.title,
        description: item.description ?? "",
        coverImageUrl: item.coverImageUrl ?? "",
        genre: item.genre ?? "",
        releaseYear: item.releaseYear ?? null,
        externalId: item.externalId,
        externalSource: item.externalSource,
        averageRating: item.averageRating ?? 0,
        ratingCount: item.ratingCount ?? 0,
      };
      if (source === "book") {
        payload.author = item.author ?? "";
      } else if (source === "movie") {
        payload.director = item.director ?? "";
      } else if (source === "music") {
        payload.artist = item.artist ?? "";
        payload.album = item.album ?? "";
      }
      await api.importExternal(payload);
      setImported((prev) => new Set(prev).add(key));
    } catch (err) {
      console.error("import failed", err);
    }
    setImporting(null);
  };

  return (
    <div className="space-y-6">
      {/* Status row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SOURCES.map((s) => {
          const isOn = status ? (status as any)[s.api] : false;
          return (
            <div
              key={s.id}
              className={cn(
                "p-3 rounded border flex items-center gap-2",
                isOn
                  ? "bg-graphite border-brass/40"
                  : "bg-graphite border-border/40 opacity-60",
              )}
            >
              {isOn ? <Cloud className="h-4 w-4 text-brass" /> : <CloudOff className="h-4 w-4 text-ash" />}
              <div>
                <div className="text-xs uppercase tracking-widest text-bone">{s.label}</div>
                <div className="text-[10px] text-ash">
                  {isOn ? "Configured" : "Not configured — add API key in .env"}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Source toggle */}
      <div className="flex gap-2 flex-wrap">
        {SOURCES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSource(s.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs uppercase tracking-widest transition-all",
              source === s.id
                ? "bg-ember text-bone"
                : "bg-graphite border border-border/60 text-ash hover:text-bone",
            )}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder={`Search ${SOURCES.find((s) => s.id === source)!.label} for content to import...`}
          className="bg-graphite border-border/60"
        />
        <Button
          onClick={handleSearch}
          disabled={loading}
          className="bg-ember text-bone hover:bg-ember/90 uppercase tracking-widest text-xs"
        >
          <Search className="h-4 w-4 mr-1" />
          Search
        </Button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <p className="text-ash text-sm text-center p-8">
          {q.trim() === "" ? "Type a query above to search external APIs." : "No results returned. Try a different query."}
        </p>
      ) : (
        <div className="space-y-2">
          {results.map((r, idx) => {
            const key = `${r.externalSource}:${r.externalId}`;
            const isImported = imported.has(key);
            return (
              <div
                key={key}
                className="flex items-start gap-3 p-3 bg-graphite border border-border/40 rounded hover:border-border/60 transition-colors"
              >
                {r.coverImageUrl ? (
                   
                  <img
                    src={r.coverImageUrl}
                    alt={r.title}
                    className="w-12 h-16 object-cover rounded shrink-0"
                  />
                ) : (
                  <div className="w-12 h-16 bg-secondary rounded shrink-0 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-ash" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-bone truncate">{r.title}</h4>
                  <p className="text-xs text-ash line-clamp-2 mt-0.5">{r.description}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-ash">
                    {r.genre && <span className="uppercase tracking-widest">{r.genre}</span>}
                    {r.releaseYear && <span>· {r.releaseYear}</span>}
                    {r.author && <span>· {r.author}</span>}
                    {r.artist && <span>· {r.artist}</span>}
                    {r.averageRating ? (
                      <span className="match-score">· {Number(r.averageRating).toFixed(1)}/5</span>
                    ) : null}
                    <span className="text-violet-halo/70">· {r.externalSource}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={isImported || importing === key}
                  onClick={() => handleImport(idx)}
                  variant={isImported ? "ghost" : "outline"}
                  className={cn(
                    "shrink-0",
                    isImported
                      ? "text-brass border-brass/40"
                      : "text-ember border-ember/40 hover:bg-ember hover:text-bone",
                  )}
                >
                  {isImported ? (
                    <><Check className="h-3 w-3 mr-1" />Imported</>
                  ) : (
                    <><Plus className="h-3 w-3 mr-1" />Import</>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
