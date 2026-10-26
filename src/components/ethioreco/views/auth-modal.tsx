// EthioReco — Auth Modal (login + register)
// Full-screen, cinematic pacing, dark atmospheric

"use client";

import { useState } from "react";
import { useAppStore } from "@/stores/app-store";
import { api } from "@/lib/api/client";
import { Wordmark } from "@/components/ethioreco/wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Eye, EyeOff } from "lucide-react";

export function AuthModal() {
  const { authMode, setAuthMode, setView, setUser, setCredits } = useAppStore();
  const [showPw, setShowPw] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRegister = authMode === "register";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        const r = await api.register({ name, email, password });
        setUser({
          id: (r.data as any).user.id,
          name: (r.data as any).user.name,
          email: (r.data as any).user.email,
          role: (r.data as any).user.role,
          preferredLanguage: "en",
          ethiopianPreference: false,
          onboardingCompleted: false,
        });
        setCredits((r.data as any).credits);
        setView("onboarding");
      } else {
        const r = await api.login({ email, password });
        const u = (r.data as any).user;
        setUser({
          id: u.id, name: u.name, email: u.email, role: u.role,
          preferredLanguage: u.preferredLanguage, ethiopianPreference: u.ethiopianPreference,
          onboardingCompleted: u.onboardingCompleted,
        });
        setCredits((r.data as any).credits);
        setView(u.onboardingCompleted ? "dashboard" : "onboarding");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-obsidian/95 backdrop-blur-sm flex items-center justify-center p-4 page-enter">
      <div className="max-w-md w-full">
        <div className="flex justify-center mb-8">
          <Wordmark size="lg" />
        </div>

        <div className="bg-graphite border border-border/60 rounded-lg p-6 sm:p-8 relative">
          <button
            onClick={() => setView("guest")}
            className="absolute top-4 right-4 text-ash hover:text-bone"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-6">
            <h2 className="text-2xl font-display uppercase tracking-tight mb-1">
              {isRegister ? "Begin Discovery" : "Welcome back"}
            </h2>
            <p className="text-xs text-ash">
              {isRegister
                ? "Create your account to start calibrating your taste"
                : "Sign in to continue your discovery"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs uppercase tracking-widest text-ash">
                  Name
                </Label>
                <Input
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-obsidian border-border/60"
                  placeholder="Amanuel T."
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-widest text-ash">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-obsidian border-border/60"
                placeholder="amanuel@uog.edu.et"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-widest text-ash">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  required
                  minLength={isRegister ? 8 : 1}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-obsidian border-border/60 pr-10"
                  placeholder={isRegister ? "At least 8 characters" : "••••••••"}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ash hover:text-bone"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-xs text-ember bg-ember/10 border border-ember/30 rounded p-2">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-ember text-bone hover:bg-ember/90 uppercase tracking-widest text-sm py-3"
            >
              {loading ? "Calibrating..." : isRegister ? "Create Account" : "Sign in"}
            </Button>

            <div className="text-center text-xs text-ash pt-2">
              {isRegister ? "Already have an account? " : "New here? "}
              <button
                type="button"
                onClick={() => setAuthMode(isRegister ? "login" : "register")}
                className="text-ember hover:underline"
              >
                {isRegister ? "Sign in" : "Begin discovery"}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-[11px] text-ash/60 mt-4">
          By creating an account you receive 100 initial credits.
          <br />
          Rate items to earn more, refresh recs to spend them.
        </p>
      </div>
    </div>
  );
}
