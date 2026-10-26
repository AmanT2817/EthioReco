// EthioReco — Main App Page
// Single-route SPA. View-switching via Zustand store.

"use client";

import { useEffect } from "react";
import { useAppStore } from "@/stores/app-store";
import { api } from "@/lib/api/client";
import { Navigation } from "@/components/ethioreco/navigation";
import { GuestLanding } from "@/components/ethioreco/views/guest-landing";
import { AuthModal } from "@/components/ethioreco/views/auth-modal";
import { OnboardingSurvey } from "@/components/ethioreco/views/onboarding-survey";
import { Dashboard } from "@/components/ethioreco/views/dashboard";
import { ItemDetail } from "@/components/ethioreco/views/item-detail";
import { EthiopianModule } from "@/components/ethioreco/views/ethiopian-module";
import { WishlistView } from "@/components/ethioreco/views/wishlist";
import { AdminConsole } from "@/components/ethioreco/views/admin-console";
import { SearchView } from "@/components/ethioreco/views/search";

export default function Page() {
  const { user, view, setUser, setCredits, setView } = useAppStore();

  // On mount — check if already authenticated
  useEffect(() => {
    api.me().then((r) => {
      const u = (r.data as any).user;
      setUser({
        id: u.id, name: u.name, email: u.email, role: u.role,
        preferredLanguage: u.preferredLanguage, ethiopianPreference: u.ethiopianPreference,
        onboardingCompleted: u.onboardingCompleted,
      });
      setCredits((r.data as any).credits);
      // Pick appropriate starting view
      if (!u.onboardingCompleted && view === "guest") setView("onboarding");
      else if (u.onboardingCompleted && (view === "guest" || view === "auth")) setView("dashboard");
    }).catch(() => {
      // not authenticated — stay on guest
    });
     
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip nav for auth/onboarding (full-screen experiences) */}
      {view !== "auth" && view !== "onboarding" && <Navigation />}

      <main className="flex-1 pt-14">
        {view === "guest" && <GuestLanding />}
        {view === "auth" && <AuthModal />}
        {view === "onboarding" && <OnboardingSurvey />}
        {view === "dashboard" && user && <Dashboard />}
        {view === "item" && <ItemDetail />}
        {view === "ethiopian" && <EthiopianModule />}
        {view === "wishlist" && user && <WishlistView />}
        {view === "admin" && user?.role === "admin" && <AdminConsole />}
        {view === "search" && <SearchView />}

        {/* Fallbacks */}
        {view === "dashboard" && !user && <GuestLanding />}
        {view === "wishlist" && !user && <GuestLanding />}
        {view === "admin" && user?.role !== "admin" && <GuestLanding />}
      </main>
    </div>
  );
}
