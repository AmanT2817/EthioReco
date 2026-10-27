// EthioReco — i18n strings
// Minimal translation table for the bilingual EN/አማ toggle.
// Ethiopian content uses BilingualText directly (Amharic primary); this
// table handles the chrome (nav, buttons, headers).

import { useAppStore } from "@/stores/app-store";

type Lang = "en" | "am";

const STRINGS = {
  // Navigation
  "nav.all": { en: "All", am: "ሁሉም" },
  "nav.movies": { en: "Movies", am: "ፊልሞች" },
  "nav.music": { en: "Music", am: "ሙዚቃ" },
  "nav.books": { en: "Books", am: "መጻሕፍት" },
  "nav.ethiopian": { en: "Ethiopian", am: "ኢትዮጵያዊ" },
  "nav.search": { en: "Search", am: "ፈልግ" },
  "nav.wishlist": { en: "Wishlist", am: "ምኞት" },
  "nav.profile": { en: "Profile", am: "መገለጫ" },
  "nav.admin": { en: "Admin", am: "አስተዳዳሪ" },
  "nav.signin": { en: "Sign in", am: "ግባ" },
  "nav.logout": { en: "Sign out", am: "ውጣ" },
  "nav.begin": { en: "Begin Discovery", am: "ግንዛቤ ጀምር" },
  "nav.notifications": { en: "Notifications", am: "ማሳወቂያዎች" },

  // Hero
  "hero.tagline": { en: "Cinematic Discovery · Hybrid AI Engine", am: "ስክሪን ግንዛቤ · ድብልቅ AI ሞተር" },
  "hero.title1": { en: "Discover what", am: "የሚስማማውን" },
  "hero.title2": { en: "fits", am: "ይወቁ" },

  // Sections
  "section.crossDomain": { en: "Cross-domain discovery", am: "ዳለፍ-ዳሮግ ግንዛቤ" },
  "section.popular": { en: "Popular this week", am: "በዚህ ሳምንት ታዋቂ" },
  "section.tonights": { en: "Tonight's Recommendations", am: "የዛሬ ምሽት ምክሮች" },
  "section.movies": { en: "Movies", am: "ፊልሞች" },
  "section.music": { en: "Music", am: "ሙዚቃ" },
  "section.books": { en: "Books", am: "መጻሕፍት" },

  // Stats
  "stats.films": { en: "Films", am: "ፊልሞች" },
  "stats.albums": { en: "Albums & Tracks", am: "አልበሞችና ዘፈኞች" },
  "stats.books": { en: "Books", am: "መጻሕፍት" },
  "stats.ethiopian": { en: "Ethiopian Works", am: "የኢትዮጵያ ስራዎች" },

  // Common actions
  "action.begin": { en: "Begin Discovery", am: "ግንዛቤ ጀምር" },
  "action.exploreEth": { en: "Explore Ethiopian", am: "የኢትዮጵያዊን ያስሱ" },
  "action.recalibrate": { en: "Recalibrate", am: "እንደገና አስተካክል" },
  "action.addToWishlist": { en: "Add to wishlist", am: "ወደ ምኞት ጨምር" },
  "action.inWishlist": { en: "In wishlist", am: "በምኞት ውስጥ" },
  "action.notInterested": { en: "Not interested", am: "አልፈልግም" },
  "action.continue": { en: "Continue", am: "ቀጥል" },
  "action.back": { en: "Back", am: "ተመለስ" },

  // Empty states
  "empty.calibrating": { en: "Calibrating your taste...", am: "ጣዕርዎን በማስተካከል ላይ..." },
  "empty.rateMore": { en: "Rate more items to sharpen this", am: "ይበልጥ ለማድረግ ተጨማሪ ዕቃዎችን ወደድብ" },
  "empty.noResults": { en: "No results found", am: "ውጤት አልተገኘም" },
} as const;

export type StringKey = keyof typeof STRINGS;

// Hook: get a translation for the current language
export function useT() {
  const language = useAppStore((s) => s.language) as Lang;
  return (key: StringKey): string => {
    const entry = STRINGS[key];
    if (!entry) return key;
    return entry[language] ?? entry.en;
  };
}

// Non-hook version (for use outside React components)
export function t(key: StringKey, lang: Lang = "en"): string {
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[lang] ?? entry.en;
}
