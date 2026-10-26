// EthioReco — Ethiopian Content Module
// Cultural gradient wash (oxblood → saffron → indigo ink)
// Three sections: Amharic Literature / Ethiopian Film / Traditional Music
// Bilingual throughout (Amharic primary, English secondary)

"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import { ItemCard, ItemRail, type ItemData } from "@/components/ethioreco/item-card";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";
import { BookOpen, Film, Music2 } from "lucide-react";

type Tab = "amharic-literature" | "film" | "music";

const TABS: { id: Tab; label: string; amharicLabel: string; icon: React.ReactNode }[] = [
  { id: "amharic-literature", label: "Amharic Literature", amharicLabel: "አማርኛ ስነ-ጽሑፍ", icon: <BookOpen className="h-4 w-4" /> },
  { id: "film", label: "Ethiopian Film", amharicLabel: "የኢትዮጵያ ፊልም", icon: <Film className="h-4 w-4" /> },
  { id: "music", label: "Traditional Music", amharicLabel: "ባህላዊ ሙዚቃ", icon: <Music2 className="h-4 w-4" /> },
];

export function EthiopianModule() {
  const { language } = useAppStore();
  const [tab, setTab] = useState<Tab>("amharic-literature");
  const [items, setItems] = useState<ItemData[]>([]);
  const [featured, setFeatured] = useState<ItemData[]>([]);

  useEffect(() => {
    api.ethiopian().then((r) => {
      const data = (r.data as any[]).map((e) => ({ ...e.item, ethiopianMetadata: e } as ItemData));
      setFeatured(data.slice(0, 6));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    api.ethiopian(tab).then((r) => {
      const data = (r.data as any[]).map((e) => ({ ...e.item, ethiopianMetadata: e } as ItemData));
      setItems(data);
    }).catch(() => {});
  }, [tab]);

  return (
    <div className="page-enter pb-24 md:pb-6">
      {/* HERO with cultural gradient wash */}
      <section className="ethiopian-wash relative overflow-hidden vignette">
        <div className="max-w-7xl mx-auto px-6 py-16 sm:py-20 relative z-10">
          <p className="text-xs uppercase tracking-widest text-brass mb-3">
            Ethiopian Cultural Module
          </p>
          <h1 className="text-4xl sm:text-6xl font-display uppercase tracking-tight leading-[0.95] mb-4">
            {language === "am" ? (
              <span className="font-amharic">የኢትዮጵያ ባህል</span>
            ) : (
              <>Ethiopian <span className="brand-ethio">cultural</span> canon</>
            )}
          </h1>
          <p className="text-ash max-w-2xl leading-relaxed mb-8">
            Tizita, Bati, Anchihoye — treated as distinct primary genres, not sub-genres of
            Western classifications. Amharic titles get primary typographic treatment.
            Editorial callouts surface the cultural significance, not footnotes.
          </p>

          {/* Featured creators spotlight */}
          {featured.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-widest text-brass mb-3">Featured creators</p>
              <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
                {featured.map((it) => (
                  <ItemCard key={it.id} item={it} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* TABS */}
      <section className="max-w-7xl mx-auto px-6 pt-8">
        <div className="flex flex-wrap gap-2 mb-8 border-b border-border/40 pb-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded text-xs uppercase tracking-widest transition-all",
                tab === t.id
                  ? "bg-brass text-obsidian"
                  : "bg-graphite border border-border/60 text-ash hover:text-bone",
              )}
            >
              {t.icon}
              <div className="flex flex-col items-start leading-tight">
                <span>{t.label}</span>
                <span className="font-amharic text-[10px] opacity-70">{t.amharicLabel}</span>
              </div>
            </button>
          ))}
        </div>

        {/* CONTENT for active tab */}
        {items.length > 0 ? (
          <ItemRail
            title={TABS.find((t) => t.id === tab)!.label}
            subtitle="Bilingual throughout — Amharic primary"
          >
            {items.map((it) => (
              <ItemCard key={it.id} item={it} />
            ))}
          </ItemRail>
        ) : (
          <div className="p-12 text-center bg-graphite border border-border/40 rounded-lg text-ash">
            No content in this category yet — admin can add via the admin console.
          </div>
        )}

        {/* CULTURAL SIGNIFICANCE editorial callouts */}
        {items.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xl font-display uppercase tracking-tight mb-6">
              Cultural significance editorial
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.slice(0, 4).filter((it) => it.ethiopianMetadata?.culturalSignificance).map((it) => (
                <article
                  key={it.id}
                  className="p-5 bg-graphite border border-border/40 rounded-lg card-hover"
                >
                  <p className="text-xs uppercase tracking-widest text-brass mb-2">
                    {it.ethiopianMetadata?.traditionalGenre ?? "Editorial"}
                    {it.ethiopianMetadata?.culturalRegion && ` · ${it.ethiopianMetadata.culturalRegion}`}
                  </p>
                  {it.ethiopianMetadata?.amharicTitle ? (
                    <h3 className="font-amharic text-lg mb-1">
                      {it.ethiopianMetadata.amharicTitle}
                    </h3>
                  ) : null}
                  <h4 className="font-display text-sm mb-2">{it.title}</h4>
                  <p className="text-xs text-ash italic leading-relaxed">
                    {it.ethiopianMetadata?.culturalSignificance}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </div>
  );
}
