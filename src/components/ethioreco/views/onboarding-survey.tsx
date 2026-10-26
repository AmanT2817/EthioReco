// EthioReco — Onboarding Survey
// Full-screen, ONE question per step (cinematic pacing per spec)
// Step 1: pick 3+ genres across movies/music/books
// Step 2: Ethiopian content toggle
// Step 3: primary medium ranking
// Step 4: optional free-text favorites (cold-start seeding)
// Progress: timeline indicator, NOT percentage bar

"use client";

import { useState } from "react";
import { useAppStore } from "@/stores/app-store";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Wordmark } from "@/components/ethioreco/wordmark";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";

const GENRES = {
  book: ["Romance", "Sci-Fi", "Fantasy", "Drama", "Thriller", "Mystery", "Historical Fiction", "Tizita", "Amharic Literature"],
  movie: ["Drama", "Sci-Fi", "Romantic Comedy", "Thriller", "Fantasy", "Ethiopian Film", "Horror", "Comedy"],
  music: ["Love Songs", "Electronic", "Tizita", "Bati", "Anchihoye", "Orchestral", "Blues", "Rock"],
};

const MEDIUMS = [
  { id: "book", label: "Read", sublabel: "Books first" },
  { id: "movie", label: "Watch", sublabel: "Films first" },
  { id: "music", label: "Listen", sublabel: "Music first" },
] as const;

type Medium = "book" | "movie" | "music";

export function OnboardingSurvey() {
  const { setView, setCredits, setUser, user } = useAppStore();
  const [step, setStep] = useState(1);
  const [bookGenres, setBookGenres] = useState<string[]>([]);
  const [movieGenres, setMovieGenres] = useState<string[]>([]);
  const [musicGenres, setMusicGenres] = useState<string[]>([]);
  const [ethiopianPref, setEthiopianPref] = useState(true);
  const [ranking, setRanking] = useState<Medium[]>([]);
  const [favorites, setFavorites] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleGenre = (cat: "book" | "movie" | "music", g: string) => {
    const setters = {
      book: [bookGenres, setBookGenres],
      movie: [movieGenres, setMovieGenres],
      music: [musicGenres, setMusicGenres],
    } as const;
    const [list, setList] = setters[cat];
    if (list.includes(g)) setList(list.filter((x) => x !== g));
    else setList([...list, g]);
  };

  const totalSelected = bookGenres.length + movieGenres.length + musicGenres.length;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await api.submitSurvey({
        bookGenres,
        movieGenres,
        musicGenres,
        ethiopianPreference: ethiopianPref,
        mediumRanking: ranking,
        favoriteTitles: favorites,
      });
      // refresh user state
      const me = await api.me();
      const u = (me.data as any).user;
      setUser({
        id: u.id, name: u.name, email: u.email, role: u.role,
        preferredLanguage: u.preferredLanguage, ethiopianPreference: u.ethiopianPreference,
        onboardingCompleted: u.onboardingCompleted,
      });
      setCredits((me.data as any).credits);
      setView("dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return totalSelected >= 3;
    if (step === 2) return true;
    if (step === 3) return ranking.length === 3;
    return true;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 page-enter">
      <div className="mb-8"><Wordmark size="md" /></div>

      <div className="max-w-2xl w-full">
        {/* Timeline indicator (NOT percentage bar per spec) */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div className={cn(
                "timeline-dot",
                step === n && "active",
                step > n && "done",
              )} />
              {n < 4 && <div className="w-8 h-px bg-border/60" />}
            </div>
          ))}
        </div>

        {/* STEP 1: Genres */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-ash mb-2">Step 1 / 4</p>
              <h2 className="text-3xl sm:text-4xl font-display uppercase tracking-tight mb-2">
                What pulls you in?
              </h2>
              <p className="text-sm text-ash">Pick 3 or more genres across books, films, and music.</p>
            </div>

            <GenreGroup
              label="Books"
              genres={GENRES.book}
              selected={bookGenres}
              onToggle={(g) => toggleGenre("book", g)}
            />
            <GenreGroup
              label="Movies"
              genres={GENRES.movie}
              selected={movieGenres}
              onToggle={(g) => toggleGenre("movie", g)}
            />
            <GenreGroup
              label="Music"
              genres={GENRES.music}
              selected={musicGenres}
              onToggle={(g) => toggleGenre("music", g)}
            />

            <div className="text-xs text-ash">
              Selected: <span className="text-ember match-score">{totalSelected}</span> / 3 minimum
            </div>
          </div>
        )}

        {/* STEP 2: Ethiopian preference */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-ash mb-2">Step 2 / 4</p>
              <h2 className="text-3xl sm:text-4xl font-display uppercase tracking-tight mb-2">
                Where do you call home?
              </h2>
              <p className="text-sm text-ash">Enable Ethiopian cultural relevance for traditional content (Tizita, Bati, Amharic literature).</p>
            </div>
            <div
              className={cn(
                "p-6 rounded-lg border-2 cursor-pointer transition-all ethiopian-wash",
                ethiopianPref ? "border-brass" : "border-border/60",
              )}
              onClick={() => setEthiopianPref(!ethiopianPref)}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-display uppercase tracking-tight mb-1">
                    Ethiopian content boost
                  </h3>
                  <p className="text-xs text-ash leading-relaxed">
                    Applies a 1.3x ranking multiplier to traditional Ethiopian content. This is a
                    ranking preference, not a quality claim — your taste signals still drive discovery.
                  </p>
                </div>
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0",
                  ethiopianPref ? "bg-brass border-brass" : "border-ash/40",
                )}>
                  {ethiopianPref && <Check className="h-4 w-4 text-obsidian" />}
                </div>
              </div>
            </div>
            <button
              onClick={() => setEthiopianPref(false)}
              className={cn(
                "text-xs underline",
                !ethiopianPref ? "text-ember" : "text-ash",
              )}
            >
              Skip — I prefer international content
            </button>
          </div>
        )}

        {/* STEP 3: Medium ranking */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-ash mb-2">Step 3 / 4</p>
              <h2 className="text-3xl sm:text-4xl font-display uppercase tracking-tight mb-2">
                Read, watch, or listen first?
              </h2>
              <p className="text-sm text-ash">Rank your primary mediums in order.</p>
            </div>
            <div className="space-y-2">
              {MEDIUMS.map((m) => {
                const idx = ranking.indexOf(m.id);
                const placed = idx !== -1;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      if (placed) setRanking(ranking.filter((x) => x !== m.id));
                      else if (ranking.length < 3) setRanking([...ranking, m.id]);
                    }}
                    className={cn(
                      "w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between",
                      placed ? "bg-ember/10 border-ember" : "bg-graphite border-border/60",
                    )}
                  >
                    <div className="text-left">
                      <div className="font-display uppercase tracking-tight">{m.label}</div>
                      <div className="text-xs text-ash">{m.sublabel}</div>
                    </div>
                    {placed && (
                      <div className="match-score text-ember text-lg">
                        #{idx + 1}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-ash">
              Ranked: <span className="match-score text-ember">{ranking.length}</span> / 3
            </p>
          </div>
        )}

        {/* STEP 4: Optional favorites */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-ash mb-2">Step 4 / 4</p>
              <h2 className="text-3xl sm:text-4xl font-display uppercase tracking-tight mb-2">
                Recent favorites?
              </h2>
              <p className="text-sm text-ash">Optional — drop a few titles to seed your cold-start profile.</p>
            </div>
            <Textarea
              value={favorites}
              onChange={(e) => setFavorites(e.target.value)}
              placeholder="e.g. Difret, Tsion's Life, Mulatu Astatke Tezeta..."
              className="bg-graphite border-border/60 min-h-[120px]"
            />
            <p className="text-xs text-ash">
              We&apos;ll match these to our catalog. Skip if you want the algorithm to learn from scratch.
            </p>
          </div>
        )}

        {error && (
          <div className="text-xs text-ember bg-ember/10 border border-ember/30 rounded p-2">
            {error}
          </div>
        )}

        {/* Footer controls */}
        <div className="flex items-center justify-between mt-12">
          <Button
            onClick={() => setStep(Math.max(1, step - 1))}
            variant="ghost"
            className="text-ash hover:text-bone"
            disabled={step === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="bg-ember text-bone hover:bg-ember/90 uppercase tracking-widest text-sm"
            >
              Continue
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-ember text-bone hover:bg-ember/90 uppercase tracking-widest text-sm"
            >
              {submitting ? "Calibrating..." : "Enter EthioReco"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function GenreGroup({
  label, genres, selected, onToggle,
}: {
  label: string;
  genres: string[];
  selected: string[];
  onToggle: (g: string) => void;
}) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-widest text-ash mb-2">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {genres.map((g) => {
          const isEth = ["Tizita", "Bati", "Anchihoye", "Amharic Literature", "Ethiopian Film"].includes(g);
          const isSel = selected.includes(g);
          return (
            <button
              key={g}
              onClick={() => onToggle(g)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs uppercase tracking-wider transition-all",
                isSel
                  ? "bg-ember text-bone border border-ember"
                  : "bg-graphite border border-border/60 text-ash hover:text-bone",
                isEth && !isSel && "text-brass border-brass/40",
              )}
            >
              {g}
            </button>
          );
        })}
      </div>
    </div>
  );
}
