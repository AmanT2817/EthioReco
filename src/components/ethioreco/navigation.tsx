// EthioReco — Navigation
// Top bar with: wordmark, discovery lenses, Ethiopian link, search, notifications, wishlist, credits, EN/አማ toggle, profile, admin, logout
// Mobile: hamburger menu (replaces bottom tab bar)

"use client";

import { useState, useEffect } from "react";
import { Wordmark } from "./wordmark";
import { useAppStore, type Lens } from "@/stores/app-store";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { NotificationsBell } from "./notifications-bell";
import { useT } from "@/lib/i18n";
import {
  Search, Heart, Coins, User, Shield, Compass, Home, LogOut, X, Menu,
  Globe2, Sparkles,
} from "lucide-react";

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
  const t = useT();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  // Apply cinematic cut transition when lens changes
  useEffect(() => {
    if (lensCutKey === 0) return;
    const el = document.getElementById("lens-stage");
    if (el) {
      el.classList.remove("lens-cut");
      void el.offsetWidth;
      el.classList.add("lens-cut");
    }
  }, [lensCutKey]);

  const handleLens = (l: Lens) => {
    setLens(l);
    if (view === "guest") setView("guest");
    if (view !== "dashboard" && view !== "guest" && user) setView("dashboard");
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {}
    setUser(null);
    setCredits(0);
    setView("guest");
    setLens("all");
    setMobileOpen(false);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-obsidian/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Left: Wordmark */}
          <Wordmark size="md" />

          {/* Center: Discovery Lenses + Ethiopian link (desktop only) */}
          {user && (
            <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
              <button
                onClick={() => handleLens("all")}
                title={language === "am" ? "ሁታንን አሳይ" : "Show all content"}
                className={cn(
                  "px-3 py-1 text-xs uppercase tracking-widest transition-colors",
                  lens === "all" ? "text-ember" : "text-ash hover:text-bone",
                )}
              >
                {t("nav.all")}
              </button>
              <span className="text-ash/30">·</span>
              {LENSES.map((l) => (
                <button
                  key={l.id}
                  onClick={() => handleLens(l.id)}
                  title={language === "am" ? `ወደ ${t(`nav.${l.id}` as any)} ቀይብ` : `Switch to ${l.label} lens`}
                  className={cn(
                    "px-3 py-1 text-xs uppercase tracking-widest transition-colors",
                    lens === l.id ? "text-ember" : "text-ash hover:text-bone",
                  )}
                >
                  {l.id === "movies" ? t("nav.movies") : l.id === "music" ? t("nav.music") : t("nav.books")}
                </button>
              ))}
              <span className="text-ash/30">·</span>
              <button
                onClick={() => { setView("ethiopian"); }}
                title={language === "am" ? "የኢትዮጵያዊ ባህል ሞጁል ያስሱ" : "Browse the Ethiopian cultural module"}
                className={cn(
                  "px-3 py-1 text-xs uppercase tracking-widest transition-colors flex items-center gap-1",
                  view === "ethiopian" ? "text-brass" : "text-ash hover:text-brass",
                )}
              >
                <Globe2 className="h-3 w-3" />
                {t("nav.ethiopian")}
              </button>
            </nav>
          )}

          {/* Right: actions */}
          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-ash hover:text-bone transition-colors"
              aria-label="Search"
              title="Search across movies, music, and books"
            >
              <Search className="h-4 w-4" />
            </button>

            {user ? (
              <>
                <NotificationsBell />
                <button
                  onClick={() => setView("wishlist")}
                  className="p-2 text-ash hover:text-bone transition-colors relative hidden sm:block"
                  aria-label="Wishlist"
                  title="Your saved items"
                >
                  <Heart className="h-4 w-4" />
                </button>
                <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-graphite border border-border/40" title="Credits remaining">
                  <Coins className="h-3 w-3 text-brass" />
                  <span className="match-score text-xs text-bone">{useAppStore.getState().credits}</span>
                </div>
                <button
                  onClick={() => setLanguage(language === "en" ? "am" : "en")}
                  className="px-2 py-1 text-xs text-ash hover:text-bone transition-colors font-mono"
                  aria-label="Toggle language"
                  title={language === "en" ? "አማርኛ (Switch to Amharic)" : "Switch to English"}
                >
                  {language === "en" ? "አማ" : "EN"}
                </button>
                <button
                  onClick={() => setView("dashboard")}
                  className="p-2 text-ash hover:text-bone transition-colors hidden sm:block"
                  aria-label="Profile"
                  title="Your dashboard"
                >
                  <User className="h-4 w-4" />
                </button>
                {user.role === "admin" && (
                  <button
                    onClick={() => setView("admin")}
                    className="p-2 text-ash hover:text-ember transition-colors hidden sm:block"
                    aria-label="Admin console"
                    title="Admin console — manage users, content, audit logs"
                  >
                    <Shield className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="p-2 text-ash hover:text-bone transition-colors hidden sm:block"
                  aria-label="Logout"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
                {/* Mobile hamburger menu button */}
                <button
                  onClick={() => setMobileOpen(true)}
                  className="md:hidden p-2 text-ash hover:text-bone transition-colors"
                  aria-label="Open menu"
                  title="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setAuthMode("login"); setView("auth"); }}
                  className="px-3 py-1.5 text-xs uppercase tracking-widest text-ash hover:text-bone transition-colors"
                >
                  {t("nav.signin")}
                </button>
                <button
                  onClick={() => { setAuthMode("register"); setView("auth"); }}
                  className="px-3 py-1.5 text-xs uppercase tracking-widest bg-ember text-bone hover:bg-ember/90 transition-colors rounded"
                >
                  {t("nav.begin")}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile hamburger menu (slide-down drawer) */}
      {user && mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[60] bg-obsidian/95 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between px-4 h-14 border-b border-border/40">
            <Wordmark size="md" />
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 text-ash hover:text-bone"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-6 space-y-2">
            {/* Lens section */}
            <div className="mb-6">
              <p className="text-xs uppercase tracking-widest text-ash mb-3">Discovery lens</p>
              <div className="grid grid-cols-2 gap-2">
                <MobileNavBtn label="All" active={lens === "all"} onClick={() => handleLens("all")} icon={<Compass className="h-4 w-4" />} />
                {LENSES.map((l) => (
                  <MobileNavBtn key={l.id} label={l.label} active={lens === l.id} onClick={() => handleLens(l.id)} icon={<LensIcon type={l.id} />} />
                ))}
              </div>
            </div>

            {/* Navigation links */}
            <div className="space-y-1">
              <MobileNavRow label="Ethiopian content" subtitle="Browse cultural module" onClick={() => { setView("ethiopian"); setMobileOpen(false); }} icon={<Globe2 className="h-4 w-4" />} active={view === "ethiopian"} accent="brass" />
              <MobileNavRow label="Dashboard" subtitle="Tonight's recommendations" onClick={() => { setView("dashboard"); setMobileOpen(false); }} icon={<Home className="h-4 w-4" />} active={view === "dashboard"} />
              <MobileNavRow label="Wishlist" subtitle={`${useAppStore.getState().credits} credits`} onClick={() => { setView("wishlist"); setMobileOpen(false); }} icon={<Heart className="h-4 w-4" />} active={view === "wishlist"} />
              {user.role === "admin" && (
                <MobileNavRow label="Admin console" subtitle="Manage users, content, logs" onClick={() => { setView("admin"); setMobileOpen(false); }} icon={<Shield className="h-4 w-4" />} active={view === "admin"} accent="ember" />
              )}
              <MobileNavRow label={`Language: ${language === "en" ? "English" : "አማርኛ"}`} subtitle="Tap to toggle" onClick={() => setLanguage(language === "en" ? "am" : "en")} icon={<span className="text-sm font-mono">{language === "en" ? "አማ" : "EN"}</span>} />
            </div>

            {/* Logout button at bottom */}
            <button
              onClick={handleLogout}
              className="w-full mt-6 p-3 rounded-lg bg-ember/10 border border-ember/30 text-ember text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </nav>
        </div>
      )}

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-[70] bg-obsidian/95 backdrop-blur-sm p-4 flex flex-col">
          <div className="max-w-2xl mx-auto w-full pt-16 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                onKeyDown={(async (e) => {
                  if (e.key === "Enter" && searchQ.trim()) {
                    setSearchOpen(false);
                    setView("search");
                  }
                }) as any}
                placeholder="Search books, films, music..."
                className="flex-1 bg-graphite border border-border/60 rounded px-4 py-3 text-bone placeholder:text-ash/60 focus:outline-none focus:border-ember/60"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="p-3 text-ash hover:text-bone"
                aria-label="Close search"
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

function MobileNavBtn({ label, active, onClick, icon }: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-3 rounded text-xs uppercase tracking-widest transition-all border",
        active
          ? "bg-ember text-bone border-ember"
          : "bg-graphite border-border/60 text-ash hover:text-bone",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function MobileNavRow({ label, subtitle, onClick, icon, active, accent }: {
  label: string;
  subtitle?: string;
  onClick: () => void;
  icon: React.ReactNode;
  active?: boolean;
  accent?: "ember" | "brass";
}) {
  const accentClass = accent === "ember" ? "text-ember" : accent === "brass" ? "text-brass" : "";
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
        active ? "bg-graphite border border-border/60" : "hover:bg-graphite/50",
      )}
    >
      <div className={accentClass || "text-ash"}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className={cn("text-sm", accentClass || "text-bone")}>{label}</div>
        {subtitle && <div className="text-xs text-ash truncate">{subtitle}</div>}
      </div>
    </button>
  );
}

function LensIcon({ type }: { type: Lens }) {
  if (type === "movies") return <Search className="h-4 w-4" />;
  if (type === "music") return <Sparkles className="h-4 w-4" />;
  return <Home className="h-4 w-4" />;
}
