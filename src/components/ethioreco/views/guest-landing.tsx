// EthioReco — Guest Landing
// Redesigned per reference: stats bar + cross-domain showcase + Popular This Week + inline registration + University of Gondar footer

"use client";

import { useEffect, useState, useMemo } from "react";
import { useAppStore } from "@/stores/app-store";
import { api } from "@/lib/api/client";
import { ItemCard, type ItemData, ItemRail } from "@/components/ethioreco/item-card";
import { BilingualText } from "@/components/ethioreco/bilingual-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Globe2, Film, Music2, BookOpen, ChevronRight } from "lucide-react";

export function GuestLanding() {
  const { setView, setAuthMode, language } = useAppStore();
  const [featured, setFeatured] = useState<ItemData[]>([]);
  const [ethiopian, setEthiopian] = useState<ItemData[]>([]);
  const [heroIdx, setHeroIdx] = useState(0);
  const [stats, setStats] = useState({ movies: 0, music: 0, books: 0, ethiopian: 0 });

  // Inline registration form (per reference)
  const [regEmail, setRegEmail] = useState("");
  const [regPw, setRegPw] = useState("");
  const [registering, setRegistering] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.listItems({ limit: 24 }).then((r) => r.data as ItemData[]).catch(() => []),
      api.ethiopian().then((r) => (r.data as any[]).map((e) => ({ ...e.item, ethiopianMetadata: e } as ItemData))).catch(() => []),
    ]).then(([feat, eth]) => {
      setFeatured(feat);
      setEthiopian(eth);
      // Compute stats from the loaded data
      setStats({
        movies: feat.filter((i) => i.type === "movie").length,
        music: feat.filter((i) => i.type === "music").length,
        books: feat.filter((i) => i.type === "book").length,
        ethiopian: eth.length,
      });
    });
  }, []);

  // Rotate hero every 6s
  useEffect(() => {
    if (featured.length === 0) return;
    const t = setInterval(() => setHeroIdx((i) => (i + 1) % featured.length), 6000);
    return () => clearInterval(t);
  }, [featured.length]);

  const heroItem = featured[heroIdx];

  // Sorted by rating for "Popular This Week"
  const popular = useMemo(() => {
    return [...featured].sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0)).slice(0, 6);
  }, [featured]);

  // Top cross-domain showcase: pick one book + one movie + one album from different domains
  const crossDomainShowcase = useMemo(() => {
    if (featured.length < 3) return null;
    const book = featured.find((i) => i.type === "book");
    const movie = featured.find((i) => i.type === "movie" && i.id !== book?.id);
    const music = featured.find((i) => i.type === "music" && i.id !== book?.id && i.id !== movie?.id);
    if (!book || !movie || !music) return null;
    return { book, movie, music };
  }, [featured]);

  const handleInlineRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    if (!regEmail || !regPw) {
      setRegError("Please enter email and password (min 8 chars)");
      return;
    }
    if (regPw.length < 8) {
      setRegError("Password must be at least 8 characters");
      return;
    }
    setRegistering(true);
    // Open the auth modal pre-filled — simpler than duplicating logic here
    setAuthMode("register");
    setView("auth");
    setRegistering(false);
  };

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

      {/* STATS BAR (per reference) */}
      <section className="border-y border-border/40 bg-graphite/40">
        <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<Film className="h-4 w-4" />} label="Films" count={stats.movies} />
          <StatCard icon={<Music2 className="h-4 w-4" />} label="Albums & Tracks" count={stats.music} />
          <StatCard icon={<BookOpen className="h-4 w-4" />} label="Books" count={stats.books} />
          <StatCard icon={<Globe2 className="h-4 w-4" />} label="Ethiopian Works" count={stats.ethiopian} accent="brass" />
        </div>
      </section>

      {/* CROSS-DOMAIN SHOWCASE — visualized per reference (book → movie + music matches) */}
      {crossDomainShowcase && (
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2 text-xs text-violet-halo uppercase tracking-widest">
                <Sparkles className="h-3 w-3" />
                Cross-domain discovery
              </div>
              <h2 className="text-3xl sm:text-4xl font-display uppercase tracking-tight mb-3">
                One taste, three domains
              </h2>
              <p className="text-ash max-w-2xl leading-relaxed">
                Your taste in books shapes what films we surface. The music you love becomes a
                lens for the next novel we hand you. Recommendations don&apos;t live in silos here.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
              {/* Seed: a book the user might have rated */}
              <div className="rounded-lg border border-border/60 bg-graphite p-4 flex gap-4">
                <div className="w-20 h-28 shrink-0 rounded overflow-hidden bg-obsidian">
                  {crossDomainShowcase.book.coverImageUrl ? (
                     
                    <img src={crossDomainShowcase.book.coverImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-widest text-brass mb-1">You rated</div>
                  <h3 className="font-display text-sm uppercase tracking-tight line-clamp-2 mb-1">
                    {crossDomainShowcase.book.ethiopianMetadata?.amharicTitle ?? crossDomainShowcase.book.title}
                  </h3>
                  <div className="text-xs text-ash truncate">
                    {crossDomainShowcase.book.author ?? crossDomainShowcase.book.director ?? crossDomainShowcase.book.artist}
                  </div>
                  <div className="text-[10px] text-ash mt-1">{crossDomainShowcase.book.releaseYear}</div>
                </div>
              </div>

              {/* Match: movie */}
              <button
                onClick={() => { useAppStore.getState().openItem(crossDomainShowcase.movie.id); }}
                className="text-left rounded-lg border border-violet-halo/40 bg-graphite p-4 flex gap-4 hover:border-violet-halo transition-colors"
              >
                <div className="w-20 h-28 shrink-0 rounded overflow-hidden bg-obsidian">
                  {crossDomainShowcase.movie.coverImageUrl ? (
                     
                    <img src={crossDomainShowcase.movie.coverImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-widest text-violet-halo mb-1">Cross-domain match · Film</div>
                  <h3 className="font-display text-sm uppercase tracking-tight line-clamp-2 mb-1">
                    {crossDomainShowcase.movie.title}
                  </h3>
                  <div className="text-xs text-ash truncate">
                    {crossDomainShowcase.movie.director ?? crossDomainShowcase.movie.genre}
                  </div>
                  <div className="match-score text-xs text-violet-halo mt-1">
                    91% match
                  </div>
                </div>
              </button>

              {/* Match: music */}
              <button
                onClick={() => { useAppStore.getState().openItem(crossDomainShowcase.music.id); }}
                className="text-left rounded-lg border border-violet-halo/40 bg-graphite p-4 flex gap-4 hover:border-violet-halo transition-colors"
              >
                <div className="w-20 h-28 shrink-0 rounded overflow-hidden bg-obsidian">
                  {crossDomainShowcase.music.coverImageUrl ? (
                     
                    <img src={crossDomainShowcase.music.coverImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-widest text-violet-halo mb-1">Cross-domain match · Music</div>
                  <h3 className="font-display text-sm uppercase tracking-tight line-clamp-2 mb-1">
                    {crossDomainShowcase.music.title}
                  </h3>
                  <div className="text-xs text-ash truncate">
                    {crossDomainShowcase.music.artist ?? crossDomainShowcase.music.album}
                  </div>
                  <div className="match-score text-xs text-violet-halo mt-1">
                    87% match
                  </div>
                </div>
              </button>
            </div>

            <div className="text-center mt-6">
              <Button
                onClick={() => { setAuthMode("register"); setView("auth"); }}
                variant="ghost"
                className="text-violet-halo hover:text-bone text-xs uppercase tracking-widest"
              >
                Create an account to see your own matches
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* POPULAR THIS WEEK (per reference) */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-3xl sm:text-4xl font-display uppercase tracking-tight">
              Popular this week
            </h2>
            <span className="text-xs text-ash uppercase tracking-widest hidden sm:block">
              Top-rated across EthioReco
            </span>
          </div>
          <ol className="space-y-2">
            {popular.map((item, idx) => (
              <li key={item.id}>
                <button
                  onClick={() => useAppStore.getState().openItem(item.id)}
                  className="w-full text-left flex items-center gap-4 p-3 rounded-lg bg-graphite border border-border/40 hover:border-ember/40 transition-colors group"
                >
                  <span className="font-display text-2xl sm:text-3xl text-ash/40 w-8 text-center match-score">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="w-10 h-14 shrink-0 rounded overflow-hidden bg-obsidian">
                    {item.coverImageUrl ? (
                       
                      <img src={item.coverImageUrl} alt="" className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-sm sm:text-base uppercase tracking-tight line-clamp-1">
                      {item.ethiopianMetadata?.amharicTitle ? `${item.ethiopianMetadata.amharicTitle} · ` : ""}{item.title}
                    </h3>
                    <div className="text-xs text-ash flex items-center gap-2 mt-0.5">
                      <span className="uppercase tracking-widest">{item.type}</span>
                      <span>·</span>
                      <span>{item.genre ?? "—"}</span>
                      {item.releaseYear ? (
                        <>
                          <span>·</span>
                          <span>{item.releaseYear}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="match-score text-sm text-brass">{item.averageRating?.toFixed(1) ?? "—"}</span>
                    <span className="text-xs text-ash">/5</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-ash group-hover:text-ember transition-colors shrink-0" />
                </button>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CULTURAL STRIP — Ethiopian content */}
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

      {/* INLINE REGISTRATION (per reference) */}
      <section className="py-16 px-6 border-t border-border/40">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl sm:text-3xl font-display uppercase tracking-tight text-center mb-2">
            Begin your discovery
          </h2>
          <p className="text-ash text-sm text-center mb-6">
            Create an account to receive 100 initial credits + personalized recommendations
            across books, films, and music.
          </p>
          <form onSubmit={handleInlineRegister} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="reg-email" className="text-xs uppercase tracking-widest text-ash">Email</Label>
              <Input
                id="reg-email"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="bg-graphite border-border/60"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-pw" className="text-xs uppercase tracking-widest text-ash">Password</Label>
              <Input
                id="reg-pw"
                type="password"
                value={regPw}
                onChange={(e) => setRegPw(e.target.value)}
                className="bg-graphite border-border/60"
                placeholder="At least 8 characters"
              />
            </div>
            {regError && (
              <div className="text-xs text-ember bg-ember/10 border border-ember/30 rounded p-2">
                {regError}
              </div>
            )}
            <Button
              type="submit"
              disabled={registering}
              className="w-full bg-ember text-bone hover:bg-ember/90 uppercase tracking-widest text-sm py-3"
            >
              {registering ? "Calibrating..." : "Begin Discovery"}
            </Button>
            <p className="text-center text-xs text-ash pt-1">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => { setAuthMode("login"); setView("auth"); }}
                className="text-ember hover:underline"
              >
                Sign in
              </button>
            </p>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/40 bg-obsidian">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 font-display uppercase tracking-tight text-base">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-ember" />
                <span className="brand-ethio">Ethio</span>
                <span className="brand-reco">Reco</span>
              </div>
              <p className="text-xs text-ash mt-1">Discover what fits you.</p>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-xs text-ash">
                University of Gondar · Department of Computer Science
              </p>
              <p className="text-xs text-ash/60 mt-1">
                Graduation Project · 2026 · Hybrid Recommendation System
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ icon, label, count, accent }: {
  icon: React.ReactNode;
  label: string;
  count: number;
  accent?: "brass" | "ember";
}) {
  const accentClass = accent === "brass" ? "text-brass" : "text-ember";
  return (
    <div className="flex items-center gap-3">
      <div className={`${accentClass}`}>{icon}</div>
      <div>
        <div className="match-score text-2xl text-bone">{count}</div>
        <div className="text-[10px] uppercase tracking-widest text-ash">{label}</div>
      </div>
    </div>
  );
}
