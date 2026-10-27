// EthioReco — Dashboard (logged-in)
// Top: greeting + credit count (mono)
// Hero band: Tonight's Recommendations — cross-domain items in horizontal scroll
// Below: three discovery rails (Movies/Music/Books)
// Sidebar (desktop) / mobile: Ethiopian content module, Wishlist, Rate-more prompt

"use client";

import { useEffect, useState } from "react";
import { useAppStore, type Lens } from "@/stores/app-store";
import { api } from "@/lib/api/client";
import { ItemCard, ItemRail, type ItemData } from "@/components/ethioreco/item-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins, RefreshCw, Sparkles, Heart, BookOpen, Globe2 } from "lucide-react";

export function Dashboard() {
  const { user, credits, lens, setView, setLens, setCredits } = useAppStore();
  const [recs, setRecs] = useState<ItemData[]>([]);
  const [items, setItems] = useState<ItemData[]>([]);
  const [calibrating, setCalibrating] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ethiopianOnly, setEthiopianOnly] = useState(false);

  useEffect(() => {
    // Initial load — fetch recs + a base catalog
    Promise.all([
      api.getRecs().then((r) => r.data as any).catch(() => ({ recs: [] })),
      api.listItems({ limit: 24 }).then((r) => r.data as ItemData[]).catch(() => []),
    ]).then(([recData, baseItems]) => {
      const recList = (recData.recs ?? []).map((r: any) => ({
        ...r.item,
        matchScore: r.finalScore,
        explanation: r.explanation,
        crossDomain: r.crossDomain,
      })) as ItemData[];
      setRecs(recList);
      setItems(baseItems);
      setCalibrating(false);
    });
  }, []);

  // Reflow items when lens changes (discovery lens UX) or Ethiopian filter toggles
  useEffect(() => {
    const params: { type?: string; origin?: string; limit: number } = { limit: 24 };
    if (lens !== "all") {
      params.type = lens === "movies" ? "movie" : lens === "music" ? "music" : "book";
    }
    if (ethiopianOnly) {
      params.origin = "ethiopian";
    }
    api.listItems(params).then((r) => setItems(r.data as ItemData[]));
  }, [lens, ethiopianOnly]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const r = await api.refreshRecs();
      const recList = ((r.data as any).recs ?? []).map((rec: any) => ({
        ...rec.item,
        matchScore: rec.finalScore,
        explanation: rec.explanation,
        crossDomain: rec.crossDomain,
      })) as ItemData[];
      setRecs(recList);
      setCredits((r.meta as any).creditsRemaining ?? credits);
    } catch {}
    setRefreshing(false);
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Tonight";
  };

  const filterItems = (type: string) => items.filter((i) => i.type === type);

  return (
    <div id="lens-stage" className="page-enter max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6 space-y-12">
      {/* Greeting + credit count + actions */}
      <header className="flex items-center justify-between gap-4 pt-2">
        <div>
          <p className="text-xs uppercase tracking-widest text-ash">
            {greeting()}, {user?.name?.split(" ")[0]}
          </p>
          <h1 className="text-3xl sm:text-4xl font-display uppercase tracking-tight">
            Your discovery screen
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Ethiopian-only filter toggle */}
          <button
            onClick={() => setEthiopianOnly(!ethiopianOnly)}
            title="Toggle: show only Ethiopian content"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs uppercase tracking-widest transition-all ${
              ethiopianOnly
                ? "bg-brass text-obsidian"
                : "bg-graphite border border-border/40 text-ash hover:text-bone"
            }`}
          >
            <Globe2 className="h-3 w-3" />
            <span className="hidden sm:inline">Ethiopian only</span>
            <span className="sm:hidden">Ethio</span>
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-graphite border border-border/40" title="Credits remaining">
            <Coins className="h-3 w-3 text-brass" />
            <span className="match-score text-sm text-bone">{credits}</span>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="border-border/60 text-ash hover:text-ember hover:border-ember/60 bg-transparent uppercase tracking-widest"
          >
            <RefreshCw className={`h-3 w-3 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Recalibrate
          </Button>
        </div>
      </header>

      {/* HERO BAND: Tonight's Recommendations */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-display uppercase tracking-tight">
              Tonight&apos;s Recommendations
            </h2>
            <p className="text-xs text-ash">
              {calibrating
                ? "Calibrating your taste..."
                : recs.length === 0
                  ? "Rate more items to sharpen this"
                  : "Cross-domain curation, hand-picked by your engine"}
            </p>
          </div>
          <Sparkles className="h-4 w-4 text-violet-halo" />
        </div>

        {calibrating ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="w-44 sm:w-52 h-72 shrink-0" />
            ))}
          </div>
        ) : recs.length > 0 ? (
          <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-2">
            {recs.map((it) => (
              <ItemCard
                key={it.id}
                item={it}
                variant={it.crossDomain ? "cross-domain" : "default"}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-graphite border border-border/40 rounded-lg">
            <p className="text-ash mb-2">Calibrating your taste...</p>
            <Button onClick={() => setView("ethiopian")} variant="outline" className="border-border/60 text-ember bg-transparent">
              Browse while we calibrate
            </Button>
          </div>
        )}
      </section>

      {/* DISCOVERY RAILS (filtered by lens) */}
      {(lens === "all" || lens === "movies") && (
        <ItemRail title="Movies" subtitle="Curated films across genres">
          {filterItems("movie").length > 0 ? (
            filterItems("movie").map((it) => <ItemCard key={it.id} item={it} />)
          ) : (
            <EmptyRail />
          )}
        </ItemRail>
      )}

      {(lens === "all" || lens === "music") && (
        <ItemRail title="Music" subtitle="Tracks and albums aligned to your taste">
          {filterItems("music").length > 0 ? (
            filterItems("music").map((it) => <ItemCard key={it.id} item={it} />)
          ) : (
            <EmptyRail />
          )}
        </ItemRail>
      )}

      {(lens === "all" || lens === "books") && (
        <ItemRail title="Books" subtitle="Amharic literature and beyond">
          {filterItems("book").length > 0 ? (
            filterItems("book").map((it) => <ItemCard key={it.id} item={it} />)
          ) : (
            <EmptyRail />
          )}
        </ItemRail>
      )}

      {/* SIDEBAR PROMPTS (mobile shown as horizontal rail) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={() => setView("ethiopian")}
          className="text-left p-4 bg-graphite border border-border/60 rounded-lg card-hover ethiopian-wash"
        >
          <Globe2 className="h-5 w-5 text-brass mb-2" />
          <h3 className="font-display uppercase tracking-tight text-sm mb-1">
            Ethiopian content
          </h3>
          <p className="text-xs text-ash leading-relaxed">
            Cultural significance editorial callouts on each item. Tizita, Bati, Amharic literature.
          </p>
        </button>
        <button
          onClick={() => setView("wishlist")}
          className="text-left p-4 bg-graphite border border-border/60 rounded-lg card-hover"
        >
          <Heart className="h-5 w-5 text-ember mb-2" />
          <h3 className="font-display uppercase tracking-tight text-sm mb-1">
            Your wishlist
          </h3>
          <p className="text-xs text-ash leading-relaxed">
            Saved for later viewing, listening, reading.
          </p>
        </button>
        <button
          onClick={() => { setLens("all"); }}
          className="text-left p-4 bg-graphite border border-border/60 rounded-lg card-hover"
        >
          <BookOpen className="h-5 w-5 text-bone mb-2" />
          <h3 className="font-display uppercase tracking-tight text-sm mb-1">
            Rate more, sharpen recs
          </h3>
          <p className="text-xs text-ash leading-relaxed">
            Every rating is a signal. Aim for 5+ to unlock full hybrid scoring.
          </p>
        </button>
      </section>
    </div>
  );
}

function EmptyRail() {
  return (
    <div className="w-44 sm:w-52 h-72 rounded-lg bg-graphite border border-border/40 flex items-center justify-center text-ash text-xs shrink-0">
      No items in this lens yet
    </div>
  );
}
