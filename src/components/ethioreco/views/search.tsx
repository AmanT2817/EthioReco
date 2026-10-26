// EthioReco — Search View

"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/app-store";
import { api } from "@/lib/api/client";
import { ItemCard, type ItemData } from "@/components/ethioreco/item-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Search as SearchIcon } from "lucide-react";

export function SearchView() {
  const { setView } = useAppStore();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<ItemData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const url = new URLSearchParams(window.location.search).get("q") ?? "";
    if (url) setQ(url);
  }, []);

  useEffect(() => {
    if (!q.trim()) {
      return;
    }
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        const r = await api.searchItems(q);
        setResults(r.data as ItemData[]);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="page-enter max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-8">
      <button
        onClick={() => setView("dashboard")}
        className="flex items-center gap-1 text-xs text-ash hover:text-bone mb-6 uppercase tracking-widest"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to discovery
      </button>

      <header className="mb-8">
        <div className="flex items-center gap-2 mb-2 text-ash text-xs uppercase tracking-widest">
          <SearchIcon className="h-4 w-4" />
          Search across all three domains
        </div>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search titles, authors, artists, directors, genres..."
          className="w-full bg-graphite border border-border/60 rounded px-4 py-3 text-bone placeholder:text-ash/60 focus:outline-none focus:border-ember/60"
        />
      </header>

      {loading ? (
        <div className="flex gap-3 flex-wrap">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="w-44 h-72" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="p-12 text-center bg-graphite border border-border/40 rounded-lg text-ash">
          {q.trim() === "" ? "Type to search." : "No results found."}
        </div>
      ) : (
        <div className="flex gap-3 flex-wrap">
          {results.map((it) => (
            <ItemCard key={it.id} item={it} />
          ))}
        </div>
      )}
    </div>
  );
}
