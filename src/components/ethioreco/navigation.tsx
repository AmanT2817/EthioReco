// EthioReco — Navigation
// Fixed top bar: wordmark (left) • discovery lenses (center) • search/wishlist/credits/lang/profile (right)
// Mobile: bottom tab bar (Discover • Search • Wishlist • Profile • Admin)

"use client";

import { useState } from "react";
import { Wordmark } from "./wordmark";
import { useAppStore, type Lens } from "@/stores/app-store";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import {
  Search, Heart, Coins, User, Shield, Compass, Home, LogOut, X, Menu,
} from "lucide-react";
import { useEffect } from "react";

const LENSES: { id: Lens; label: string }[] = [
  { id: "movies", label: "Movies" },
  { id: "music", label: "Music" },
  { id: "books", label: "Books" },
];

export function Navigation() {
  const {
    user, setView, view, lens, setLens, lensCutKey,
    language, setLanguage, setCredits, setUser, setAuthMode,
  } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  // Apply cinematic cut transition when lens changes
  useEffect(() => {
    if (lensCutKey === 0) return;
    const el = document.getElementById("lens-stage");
    if (el) {
      el.classList.remove("lens-cut");
      // force reflow then re-add
      void el.offsetWidth;
      el.classList.add("lens-cut");
    }
  }, [lensCutKey]);

  const handleLens = (l: Lens) => {
    setLens(l);
    if (view === "guest") setView("guest"); // stay on landing but reflow featured
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {}
    setUser(null);
    setCredits(0);
    setView("guest");
    setLens("all");
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-obsidian/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Left: Wordmark */}
          <Wordmark size="md" />

          {/* Center: Discovery Lenses (desktop only) */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
              <button
                onClick={() => handleLens("all")}
                className={cn(
                  "px-3 py-1 text-xs uppercase tracking-widest transition-colors",
                  lens === "all" ? "text-ember" : "text-ash hover:text-bone",
                )}
              >
                All
              </button>
              <span className="text-ash/30">·</span>
              {LENSES.map((l) => (
                <button
                  key={l.id}
                  onClick={() => handleLens(l.id)}
                  className={cn(
                    "px-3 py-1 text-xs uppercase tracking-widest transition-colors",
                    lens === l.id ? "text-ember" : "text-ash hover:text-bone",
                  )}
                >
                  {l.label}
                </button>
              ))}
            </nav>
          )}

          {/* Right: actions */}
          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-ash hover:text-bone transition-colors"
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </button>

            {user ? (
              <>
                <button
                  onClick={() => setView("wishlist")}
                  className="p-2 text-ash hover:text-bone transition-colors relative"
                  aria-label="Wishlist"
                >
                  <Heart className="h-4 w-4" />
                </button>
                <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-graphite border border-border/40">
                  <Coins className="h-3 w-3 text-brass" />
                  <span className="match-score text-xs text-bone">{useAppStore.getState().credits}</span>
                </div>
                <button
                  onClick={() => setLanguage(language === "en" ? "am" : "en")}
                  className="px-2 py-1 text-xs text-ash hover:text-bone transition-colors font-mono"
                  aria-label="Toggle language"
                >
                  {language === "en" ? "አማ" : "EN"}
                </button>
                <button
                  onClick={() => setView("dashboard")}
                  className="p-2 text-ash hover:text-bone transition-colors"
                  aria-label="Profile"
                >
                  <User className="h-4 w-4" />
                </button>
                {user.role === "admin" && (
                  <button
                    onClick={() => setView("admin")}
                    className="p-2 text-ash hover:text-ember transition-colors"
                    aria-label="Admin"
                  >
                    <Shield className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="p-2 text-ash hover:text-bone transition-colors"
                  aria-label="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setAuthMode("login"); setView("auth"); }}
                  className="px-3 py-1.5 text-xs uppercase tracking-widest text-ash hover:text-bone transition-colors"
                >
                  Sign in
                </button>
                <button
                  onClick={() => { setAuthMode("register"); setView("auth"); }}
                  className="px-3 py-1.5 text-xs uppercase tracking-widest bg-ember text-bone hover:bg-ember/90 transition-colors rounded"
                >
                  Begin Discovery
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      {user && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-obsidian/95 backdrop-blur border-t border-border/40">
          <div className="grid grid-cols-5 h-14">
            <MobileTab icon={<Compass className="h-4 w-4" />} label="Discover" onClick={() => setView("dashboard")} active={view === "dashboard"} />
            <MobileTab icon={<Search className="h-4 w-4" />} label="Search" onClick={() => setSearchOpen(true)} />
            <MobileTab icon={<Heart className="h-4 w-4" />} label="Wishlist" onClick={() => setView("wishlist")} active={view === "wishlist"} />
            <MobileTab icon={<User className="h-4 w-4" />} label="Profile" onClick={() => setView("dashboard")} active={view === "dashboard"} />
            {user.role === "admin" ? (
              <MobileTab icon={<Shield className="h-4 w-4" />} label="Admin" onClick={() => setView("admin")} active={view === "admin"} />
            ) : (
              <MobileTab icon={<Home className="h-4 w-4" />} label="Landing" onClick={handleLogout} />
            )}
          </div>
        </nav>
      )}

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[60] bg-obsidian/95 backdrop-blur-sm p-4 flex flex-col">
          <div className="max-w-2xl mx-auto w-full pt-16 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && searchQ.trim()) {
                    setSearchOpen(false);
                    setView("search");
                  }
                }}
                placeholder="Search books, films, music..."
                className="flex-1 bg-graphite border border-border/60 rounded px-4 py-3 text-bone placeholder:text-ash/60 focus:outline-none focus:border-ember/60"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="p-3 text-ash hover:text-bone"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-ash">Press Enter to search across all three domains</p>
          </div>
        </div>
      )}
    </>
  );
}

function MobileTab({
  icon, label, onClick, active,
}: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 text-[10px] uppercase tracking-widest transition-colors",
        active ? "text-ember" : "text-ash hover:text-bone",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
