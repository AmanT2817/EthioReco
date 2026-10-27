// EthioReco — Item Detail Page
// Two-column: Left = cover art (large, atmospheric shadow), Right = metadata
// Includes cross-domain match cards (violet halo accent) — the killer feature

"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/app-store";
import { api } from "@/lib/api/client";
import { BilingualText } from "@/components/ethioreco/bilingual-text";
import { StarRating } from "@/components/ethioreco/star-rating";
import { ItemCard, type ItemData } from "@/components/ethioreco/item-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Heart, Sparkles, ThumbsDown, Bell, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function ItemDetail() {
  const { activeItemId, setView } = useAppStore();
  const [item, setItem] = useState<ItemData | null>(null);
  const [crossDomain, setCrossDomain] = useState<ItemData[]>([]);
  const [myRating, setMyRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [notInterested, setNotInterested] = useState(false);
  const [notifyOnMatch, setNotifyOnMatch] = useState(false);

  useEffect(() => {
    if (!activeItemId) return;
    Promise.all([
      api.getItem(activeItemId).then((r) => r.data as ItemData).catch(() => null),
      api.crossDomainFor(activeItemId).then((r) => r.data as ItemData[]).catch(() => []),
    ]).then(([it, cd]) => {
      setItem(it);
      setCrossDomain(cd);
    });
  }, [activeItemId]);

  // Check wishlist + my rating
  useEffect(() => {
    if (!activeItemId) return;
    api.getWishlist().then((r) => {
      const wl = (r.data as any[]).find((w) => w.itemId === activeItemId);
      if (wl) {
        setInWishlist(true);
        setNotifyOnMatch(!!wl.notifyOnMatch);
      } else {
        setInWishlist(false);
        setNotifyOnMatch(false);
      }
    }).catch(() => {});
    api.myRatings().then((r) => {
      const rating = (r.data as any[]).find((rt) => rt.itemId === activeItemId);
      if (rating) {
        setMyRating(rating.score);
        setNotInterested(rating.notInterested);
      }
    }).catch(() => {});
  }, [activeItemId]);

  const handleRate = async (score: number) => {
    setSubmitting(true);
    try {
      await api.rateItem(activeItemId!, score);
      setMyRating(score);
    } catch {}
    setSubmitting(false);
  };

  const handleWishlist = async () => {
    if (inWishlist) {
      await api.removeWishlist(activeItemId!);
      setInWishlist(false);
      setNotifyOnMatch(false);
    } else {
      await api.addWishlist(activeItemId!, "medium");
      setInWishlist(true);
    }
  };

  const handleNotifyToggle = async () => {
    if (!inWishlist) return; // safety — must be in wishlist first
    const next = !notifyOnMatch;
    setNotifyOnMatch(next);
    try {
      await api.toggleNotifyOnMatch(activeItemId!, next);
    } catch {
      setNotifyOnMatch(!next); // revert on error
    }
  };

  const handleNotInterested = async () => {
    setSubmitting(true);
    try {
      await api.rateItem(activeItemId!, 0.5);
      setNotInterested(true);
    } catch {}
    setSubmitting(false);
  };

  if (!item) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-8 pb-24 md:pb-8 page-enter">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="aspect-[2/3] w-full" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    );
  }

  const isEthiopian = !!item.ethiopianMetadata;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-8 page-enter">
      <button
        onClick={() => setView("dashboard")}
        className="flex items-center gap-1 text-xs text-ash hover:text-bone mb-6 uppercase tracking-widest"
      >
        <ChevronLeft className="h-3 w-3" />
        Back to discovery
      </button>

      <div className="grid grid-cols-1 md:grid-cols-[280px,1fr] gap-8">
        {/* LEFT: Cover art — constrained to 280px (was 400px, way too wide) */}
        <div className="relative mx-auto md:mx-0 w-full max-w-[280px]">
          <div className="aspect-[2/3] rounded-lg overflow-hidden bg-graphite relative vignette shadow-2xl shadow-obsidian">
            {item.coverImageUrl ? (
               
              <img
                src={item.coverImageUrl}
                alt={item.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-ash text-xs">
                No cover image
              </div>
            )}
          </div>
          {/* Brass cultural badge */}
          {isEthiopian && (
            <div className="absolute -bottom-3 -right-3 brass-badge px-3 py-1.5 text-xs rounded shadow-lg">
              {item.ethiopianMetadata?.traditionalGenre ?? "ETHIO"}
              {item.ethiopianMetadata?.culturalRegion && ` · ${item.ethiopianMetadata.culturalRegion}`}
            </div>
          )}
        </div>

        {/* RIGHT: Metadata */}
        <div className="space-y-6">
          {/* Bilingual title hierarchy (Amharic primary on Ethiopian content) */}
          {isEthiopian && item.ethiopianMetadata?.amharicTitle ? (
            <BilingualText
              english={item.title}
              amharic={item.ethiopianMetadata.amharicTitle}
              variant="primary-amharic"
              as="h1"
              amharicClassName="text-3xl sm:text-4xl font-display uppercase tracking-tight leading-tight"
              className="text-base text-ash"
            />
          ) : (
            <h1 className="text-3xl sm:text-4xl font-display uppercase tracking-tight leading-tight">
              {item.title}
            </h1>
          )}

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-ash uppercase tracking-widest">
            <span className="text-bone">{item.type}</span>
            {item.releaseYear && <span>· {item.releaseYear}</span>}
            {item.genre && <span>· {item.genre}</span>}
            {item.language && <span>· {item.language}</span>}
            {item.country && <span>· {item.country}</span>}
          </div>

          {/* Type-specific metadata */}
          <div className="text-sm text-ash space-y-1">
            {item.author && <div><span className="text-bone/60">Author:</span> {item.author}</div>}
            {item.director && <div><span className="text-bone/60">Director:</span> {item.director}</div>}
            {item.artist && <div><span className="text-bone/60">Artist:</span> {item.artist}</div>}
            {item.album && <div><span className="text-bone/60">Album:</span> {item.album}</div>}
          </div>

          {/* Average rating + your rating */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-ash mb-1">Community</p>
                <div className="flex items-center gap-2">
                  <StarRating value={item.averageRating} readOnly size="sm" />
                  <span className="match-score text-xs text-ash">
                    {item.averageRating.toFixed(1)} · {item.ratingCount} ratings
                  </span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-ash mb-1">Your rating</p>
              <StarRating
                value={myRating ?? 0}
                onChange={handleRate}
                size="lg"
                showScore
              />
            </div>
          </div>

          {/* Description (bilingual for Ethiopian) */}
          {isEthiopian && item.ethiopianMetadata?.amharicDescription ? (
            <div className="space-y-2">
              <BilingualText
                english={item.description}
                amharic={item.ethiopianMetadata.amharicDescription}
                variant="stacked"
                as="p"
                amharicClassName="text-base text-bone/90 leading-relaxed"
                className="text-sm text-ash leading-relaxed"
              />
            </div>
          ) : (
            item.description && (
              <p className="text-sm text-ash leading-relaxed">{item.description}</p>
            )
          )}

          {/* Cultural significance (Ethiopian only) */}
          {isEthiopian && item.ethiopianMetadata?.culturalSignificance && (
            <div className="border-l-2 border-brass pl-4 py-2">
              <p className="text-[10px] uppercase tracking-widest text-brass mb-1">
                Cultural significance
              </p>
              <p className="text-xs text-ash leading-relaxed italic">
                {item.ethiopianMetadata.culturalSignificance}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button
              onClick={handleWishlist}
              variant="outline"
              className={cn(
                "border-border/60 text-bone hover:text-ember hover:border-ember/60 bg-transparent",
                inWishlist && "border-ember/60 text-ember",
              )}
            >
              <Heart className={cn("h-4 w-4 mr-2", inWishlist && "fill-ember")} />
              {inWishlist ? "In wishlist" : "Add to wishlist"}
            </Button>
            {inWishlist && (
              <Button
                onClick={handleNotifyToggle}
                variant="outline"
                className={cn(
                  "border-border/60 text-bone hover:text-violet-halo hover:border-violet-halo/60 bg-transparent",
                  notifyOnMatch && "border-violet-halo/60 text-violet-halo",
                )}
                title="Notify when a strong cross-domain match is found for this item"
              >
                {notifyOnMatch ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
                {notifyOnMatch ? "Notifying" : "Notify on match"}
              </Button>
            )}
            <Button
              onClick={handleNotInterested}
              disabled={submitting}
              variant="ghost"
              className={cn(
                "text-ash hover:text-bone",
                notInterested && "text-ember",
              )}
            >
              <ThumbsDown className="h-4 w-4 mr-2" />
              {notInterested ? "Marked not interested" : "Not interested"}
            </Button>
          </div>
          {inWishlist && notifyOnMatch && (
            <p className="text-xs text-violet-halo/80 italic mt-1">
              We&apos;ll surface a notification here and in the bell dropdown when we find a
              strong cross-domain match for this item.
            </p>
          )}
        </div>
      </div>

      {/* CROSS-DOMAIN MATCH CARDS — the killer feature */}
      <section className="mt-16">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-violet-halo" />
          <p className="text-xs uppercase tracking-widest text-violet-halo">
            Cross-domain recommendations
          </p>
        </div>
        <h2 className="text-2xl sm:text-3xl font-display uppercase tracking-tight mb-2">
          If you liked this, you might also like
        </h2>
        <p className="text-xs text-ash mb-6">
          Surfaced from the other two domains based on this item&apos;s metadata.
        </p>

        {crossDomain.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
            {crossDomain.map((it) => (
              <ItemCard key={it.id} item={{ ...it, crossDomain: true }} variant="cross-domain" />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-graphite border border-border/40 rounded-lg text-ash text-sm">
            No cross-domain matches yet — rate this item to refine.
          </div>
        )}
      </section>
    </div>
  );
}
