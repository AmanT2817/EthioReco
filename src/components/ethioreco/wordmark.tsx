// EthioReco — Logo + Wordmark
// Shows the EthioReco logo (film reel + book + network tree + music note in Ethiopian flag colors)
// followed by the split-color "Ethio" (ember) + "Reco" (bone) wordmark text.
// Click anywhere → go to dashboard (if logged in) or guest landing.

import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";

interface WordmarkProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showLogo?: boolean; // include the icon portion of the logo
}

export function Wordmark({ className, size = "md", showLogo = true }: WordmarkProps) {
  const setView = useAppStore((s) => s.setView);
  const setLens = useAppStore((s) => s.setLens);
  const sizeClass = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-3xl sm:text-4xl",
  }[size];
  const logoSize = {
    sm: "h-6 w-6",
    md: "h-7 w-7",
    lg: "h-10 w-10 sm:h-12 sm:w-12",
  }[size];

  return (
    <button
      onClick={() => {
        setLens("all");
        setView(useAppStore.getState().user ? "dashboard" : "guest");
      }}
      className={cn(
        "flex items-center gap-2 font-display uppercase tracking-tight",
        sizeClass,
        className,
      )}
      aria-label="EthioReco home"
    >
      {showLogo && (
         
        <img
          src="/ethioreco-logo-small.png"
          alt="EthioReco"
          className={cn(logoSize, "object-contain")}
        />
      )}
      <span className="brand-ethio">Ethio</span>
      <span className="brand-reco">Reco</span>
    </button>
  );
}
