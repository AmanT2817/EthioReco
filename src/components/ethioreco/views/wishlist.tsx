// EthioReco — Wishlist View

"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/app-store";
import { api } from "@/lib/api/client";
import { ItemCard, type ItemData } from "@/components/ethioreco/item-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, ArrowLeft } from "lucide-react";

export function WishlistView() {
  const { setView } = useAppStore();
  const [items, setItems] = useState<ItemData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getWishlist().then((r) => {
      const data = (r.data as any[]).map((w) => ({
        ...w.item,
        ethiopianMetadata: w.item.ethiopianMetadata,
      })) as ItemData[];
      setItems(data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-enter max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-8">
      <button
        onClick={() => setView("dashboard")}
        className="flex items-center gap-1 text-xs text-ash hover:text-bone mb-6 uppercase tracking-widest"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to discovery
      </button>

      <header className="mb-8 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-5 w-5 text-ember" />
            <span className="text-xs uppercase tracking-widest text-ash">Saved for later</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display uppercase tracking-tight">
            Your wishlist
          </h1>
        </div>
        <p className="match-score text-sm text-ash">{items.length} items</p>
      </header>

      {loading ? (
        <div className="flex gap-3 flex-wrap">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="w-44 h-72" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-graphite border border-border/40 rounded-lg">
          <p className="text-ash mb-2">Your wishlist is empty.</p>
          <p className="text-xs text-ash/70">
            Save items from any item detail page to revisit them here.
          </p>
        </div>
      ) : (
        <div className="flex gap-3 flex-wrap">
          {items.map((it) => (
            <ItemCard key={it.id} item={it} />
          ))}
        </div>
      )}
    </div>
  );
}
