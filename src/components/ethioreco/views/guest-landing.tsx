// EthioReco — Guest Landing
// Atmospheric hero with rotating featured content + cross-domain discovery showcase + cultural strip

"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/stores/app-store";
import { api } from "@/lib/api/client";
import { ItemCard, type ItemData, ItemRail } from "@/components/ethioreco/item-card";
import { BilingualText } from "@/components/ethioreco/bilingual-text";
import { Button } from "@/components/ui/button";
import { Sparkles, Globe2 } from "lucide-react";

export function GuestLanding() {
  const { setView, setAuthMode, language } = useAppStore();
  const [featured, setFeatured] = useState<ItemData[]>([]);
  const [ethiopian, setEthiopian] = useState<ItemData[]>([]);
  const [heroIdx, setHeroIdx] = useState(0);

  useEffect(() => {
    Promise.all([
      api.listItems({ limit: 8 }).then((r) => r.data as ItemData[]).catch(() => []),
      api.ethiopian().then((r) => (r.data as any[]).map((e) => ({ ...e.item, ethiopianMetadata: e } as ItemData))).catch(() => []),
    ]).then(([feat, eth]) => {
      setFeatured(feat);
      setEthiopian(eth);
    });
  }, []);

  // Rotate hero every 6s (per spec)
  useEffect(() => {
    if (featured.length === 0) return;
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % featured.length), 6000);
    return () => clearInterval(t);
  }, [featured.length]);

  const heroItem = featured[heroIdx];

  return (
    <div className="page-enter">
      {/* HERO */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          {heroItem?.coverImageUrl ? (
             
            <img
              src={heroItem.coverImageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-40 cross-dissolve"
              key={heroIdx}
            />
          ) : (
            <div className="absolute inset-0 ethiopian-wash opacity-30" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/60 to-obsidian/30" />
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                width: `${20 + i * 8}px`,
                height: `${20 + i * 8}px`,
                top: `${(i * 13) % 80 + 10}%`,
                left: `${(i * 27) % 90}%`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 sm:py-24 w-full">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4 text-ash text-xs uppercase tracking-widest">
              <span className="inline-block w-2 h-2 rounded-full bg-ember animate-pulse" />
              Cinematic Discovery · Hybrid AI Engine
            </div>
            <h1 className="text-5xl sm:text-7xl font-display uppercase tracking-tight leading-[0.9] mb-6">
              Discover what
              <br />
              <span className="brand-ethio">fits</span> <span className="brand-reco">you.</span>
            </h1>
            {language === "am" && (
              <BilingualText
                amharic="የሚስማማውን ይወቁ"
                english="Discover what fits you"
                variant="primary-amharic"
                className="text-2xl mb-4"
                amharicClassName="text-2xl"
              />
            )}
            <p className="text-base sm:text-lg text-ash leading-relaxed mb-8 max-w-xl">
              Movies, music, and books — one discovery engine. Built with Ethiopian cultural
              relevance. Cross-domain recommendations surface a film because of a book you loved,
              a track because of a movie that moved you.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => { setAuthMode("register"); setView("auth"); }}
                className="bg-ember text-bone hover:bg-ember/90 px-6 py-3 text-sm uppercase tracking-widest"
              >
                Begin Discovery
              </Button>
              <Button
                onClick={() => setView("ethiopian")}
                variant="outline"
                className="border-border/60 text-bone hover:text-ember hover:border-ember/60 px-6 py-3 text-sm uppercase tracking-widest bg-transparent"
              >
                Explore Ethiopian
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CROSS-DOMAIN DISCOVERY SHOWCASE */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2 text-xs text-violet-halo uppercase tracking-widest">
                <Sparkles className="h-3 w-3" />
                Unique UX move
              </div>
              <h2 className="text-3xl sm:text-4xl font-display uppercase tracking-tight">
                Cross-domain discovery
              </h2>
            </div>
          </div>
          <p className="text-ash max-w-2xl mb-8 leading-relaxed">
            Your taste in books shapes what films we surface. The music you love becomes a
            lens for the next novel we hand you. Recommendations don&apos;t live in silos here.
          </p>

          <ItemRail title="Tonight's Cross-Domain Showcase" subtitle="Surfaced from other domains">
            {featured.length > 0 ? (
              featured.slice(0, 6).map((it) => (
                <ItemCard key={it.id} item={{ ...it, crossDomain: true }} variant="cross-domain" />
              ))
            ) : (
              Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            )}
          </ItemRail>
        </div>
      </section>

      {/* CULTURAL STRIP */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto ethiopian-wash rounded-xl p-8 sm:p-12 relative overflow-hidden vignette">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3 text-brass text-xs uppercase tracking-widest">
              <Globe2 className="h-4 w-4" />
              Ethiopian Cultural Module
            </div>
            <h2 className="text-3xl sm:text-4xl font-display uppercase tracking-tight mb-3">
              Amharic literature · Tizita · Bati
            </h2>
            <p className="text-ash max-w-2xl mb-6 leading-relaxed">
              Traditional Ethiopian music genres get the typographic treatment they deserve —
              Tizita is Tizita, not &quot;sad music.&quot; Amharic titles get primary typographic placement,
              with English as the supporting voice. Not a translation toggle — a designed-in
              dual-language experience.
            </p>
            {ethiopian.length > 0 && (
              <ItemRail title="Featured Ethiopian Content" subtitle="Bilingual throughout">
                {ethiopian.slice(0, 6).map((it) => (
                  <ItemCard key={it.id} item={it} />
                ))}
              </ItemRail>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="w-44 sm:w-52 rounded-lg bg-graphite border border-border/60 overflow-hidden animate-pulse shrink-0">
      <div className="aspect-[2/3] bg-secondary" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-secondary rounded w-3/4" />
        <div className="h-2 bg-secondary/70 rounded w-1/2" />
      </div>
    </div>
  );
}
