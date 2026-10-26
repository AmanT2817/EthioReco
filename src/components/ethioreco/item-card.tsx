// EthioReco — Item Card
// Used in rails, search, wishlist. Cross-domain variant gets violet halo.

"use client";

import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { BilingualText } from "./bilingual-text";
import { StarRating } from "./star-rating";
import { ImageOff, Sparkles } from "lucide-react";
import { useState } from "react";

export interface ItemData {
  id: string;
  title: string;
  type: "book" | "movie" | "music";
  description: string;
  genre?: string | null;
  coverImageUrl?: string | null;
  averageRating: number;
  ratingCount: number;
  ethiopianMetadata?: {
    culturalRegion?: string | null;
    traditionalGenre?: string | null;
    isTraditional: boolean;
    amharicTitle?: string | null;
    amharicDescription?: string | null;
  } | null;
  // Cross-domain context (when surfaced as cross-domain rec)
  crossDomain?: boolean;
  crossDomainSource?: string;
  // For recs
  matchScore?: number;
  explanation?: string;
}

interface ItemCardProps {
  item: ItemData;
  variant?: "default" | "cross-domain" | "compact" | "hero";
  className?: string;
}

const TYPE_LABEL: Record<string, string> = {
  book: "BOOK",
  movie: "FILM",
  music: "MUSIC",
};

export function ItemCard({ item, variant = "default", className }: ItemCardProps) {
  const openItem = useAppStore((s) => s.openItem);
  const [imgError, setImgError] = useState(false);

  const isCrossDomain = variant === "cross-domain" || item.crossDomain;
  const isHero = variant === "hero";
  const isCompact = variant === "compact";
  const isEthiopian = !!item.ethiopianMetadata;

  return (
    <button
      onClick={() => openItem(item.id)}
      className={cn(
        "group relative text-left card-hover overflow-hidden",
        "rounded-lg bg-graphite border border-border/60",
        isCrossDomain && "cross-domain-halo",
        isHero && "breathe",
        !isCompact && !isHero && "w-44 sm:w-52",
        isCompact && "w-36",
        isHero && "w-full max-w-2xl",
        className,
      )}
    >
      {/* Cover */}
      <div className={cn(
        "relative aspect-[2/3] bg-obsidian overflow-hidden",
        isHero && "aspect-[16/10] sm:aspect-[2/3]",
      )}>
        {item.coverImageUrl && !imgError ? (
           
          <img
            src={item.coverImageUrl}
            alt={item.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageOff className="h-8 w-8 text-ash/30" />
          </div>
        )}
        {/* Vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/30 to-transparent" />

        {/* Type badge (top-left) */}
        <div className="absolute top-2 left-2 brass-badge px-1.5 py-0.5 text-[10px] rounded">
          {TYPE_LABEL[item.type]}
        </div>

        {/* Ethiopian badge (top-right) */}
        {isEthiopian && (
          <div className="absolute top-2 right-2 brass-badge px-1.5 py-0.5 text-[10px] rounded">
            {item.ethiopianMetadata?.traditionalGenre ?? "ETHIO"}
          </div>
        )}

        {/* Cross-domain indicator */}
        {isCrossDomain && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] text-violet-halo bg-obsidian/80 px-1.5 py-0.5 rounded uppercase tracking-wider">
            <Sparkles className="h-3 w-3" />
            Cross-domain
          </div>
        )}

        {/* Match score (mono) */}
        {item.matchScore !== undefined && (
          <div className="absolute bottom-2 left-2 match-score text-xs text-bone bg-obsidian/80 px-1.5 py-0.5 rounded">
            {(item.matchScore * 100).toFixed(0)}% match
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3 space-y-1.5">
        {isEthiopian && item.ethiopianMetadata?.amharicTitle ? (
          <BilingualText
            english={item.title}
            amharic={item.ethiopianMetadata.amharicTitle}
            variant="primary-amharic"
            as="h3"
            className="font-medium text-sm leading-tight line-clamp-2"
            amharicClassName="text-sm leading-tight"
          />
        ) : (
          <h3 className="font-medium text-sm leading-tight line-clamp-2">{item.title}</h3>
        )}

        {/* Metadata row */}
        <div className="flex items-center justify-between text-xs text-ash">
          <span className="truncate">{item.genre ?? "—"}</span>
          {item.averageRating > 0 && (
            <span className="match-score text-[11px]">
              {item.averageRating.toFixed(1)} ({item.ratingCount})
            </span>
          )}
        </div>

        {/* Explanation (rec cards only) */}
        {item.explanation && (
          <p className="text-[11px] text-ash/80 italic line-clamp-1 pt-1 border-t border-border/40">
            {item.explanation}
          </p>
        )}
      </div>
    </button>
  );
}

// Skeleton variant for "Calibrating your taste..." loading states
export function ItemCardSkeleton({ variant = "default" }: { variant?: "default" | "compact" | "hero" }) {
  const isHero = variant === "hero";
  const isCompact = variant === "compact";
  return (
    <div
      className={cn(
        "rounded-lg bg-graphite border border-border/60 overflow-hidden animate-pulse",
        !isCompact && !isHero && "w-44 sm:w-52",
        isCompact && "w-36",
        isHero && "w-full max-w-2xl",
      )}
    >
      <div className={cn("aspect-[2/3] bg-secondary", isHero && "aspect-[16/10] sm:aspect-[2/3]")} />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-secondary rounded w-3/4" />
        <div className="h-2 bg-secondary/70 rounded w-1/2" />
      </div>
    </div>
  );
}

// Horizontal scroll rail (Netflix-style)
export function ItemRail({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <header className="flex items-end justify-between px-1">
        <div>
          <h2 className="text-lg sm:text-xl font-display uppercase tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-ash">{subtitle}</p>}
        </div>
        <span className="text-[10px] text-ash uppercase tracking-widest hidden sm:block">Scroll →</span>
      </header>
      <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-2 px-1">
        {children}
      </div>
    </section>
  );
}
