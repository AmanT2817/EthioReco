// EthioReco — App Store
// View-switching state + auth state + lens state. Cinematic naming throughout.

import { create } from "zustand";

export type View =
  | "guest"          // landing
  | "auth"           // login/register modal
  | "onboarding"     // survey
  | "dashboard"      // logged-in home
  | "item"           // item detail
  | "ethiopian"      // Ethiopian content module
  | "wishlist"       // user's wishlist
  | "admin"          // admin console
  | "search";        // search results

export type Lens = "movies" | "music" | "books" | "all";
export type Language = "en" | "am";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  preferredLanguage: Language;
  ethiopianPreference: boolean;
  onboardingCompleted: boolean;
}

interface AppState {
  // session
  user: SessionUser | null;
  credits: number;
  setUser: (u: SessionUser | null) => void;
  setCredits: (n: number) => void;

  // view
  view: View;
  setView: (v: View) => void;

  // active lens (discovery feed reflow)
  lens: Lens;
  setLens: (l: Lens) => void;
  lensCutKey: number; // bumped to trigger cinematic cut transition

  // active item id (for item detail view)
  activeItemId: string | null;
  openItem: (id: string) => void;

  // language toggle
  language: Language;
  setLanguage: (l: Language) => void;

  // auth modal mode
  authMode: "login" | "register";
  setAuthMode: (m: "login" | "register") => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  credits: 0,
  setUser: (u) => set({ user: u }),
  setCredits: (n) => set({ credits: n }),

  view: "guest",
  setView: (v) => set({ view: v }),

  lens: "all",
  setLens: (l) => set({ lens: l, lensCutKey: get().lensCutKey + 1 }),
  lensCutKey: 0,

  activeItemId: null,
  openItem: (id) => set({ activeItemId: id, view: "item" }),

  language: "en",
  setLanguage: (l) => set({ language: l }),

  authMode: "register",
  setAuthMode: (m) => set({ authMode: m }),
}));

// Convenience selectors
export const useIsAdmin = () => useAppStore((s) => s.user?.role === "admin");
export const useIsAuthed = () => useAppStore((s) => s.user !== null);
