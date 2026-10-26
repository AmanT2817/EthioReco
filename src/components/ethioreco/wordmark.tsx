// EthioReco — Split-color Wordmark ("Ethio" + "Reco")
// Brand signature: cultural root + recommendation engine duality

import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";

interface WordmarkProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Wordmark({ className, size = "md" }: WordmarkProps) {
  const setView = useAppStore((s) => s.setView);
  const setLens = useAppStore((s) => s.setLens);
  const sizeClass = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-4xl sm:text-5xl",
  }[size];

  return (
    <button
      onClick={() => {
        setLens("all");
        setView(useAppStore.getState().user ? "dashboard" : "guest");
      }}
      className={cn(
        "flex items-center gap-1.5 font-display uppercase tracking-tight",
        sizeClass,
        className,
      )}
      aria-label="EthioReco home"
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-ember animate-pulse" aria-hidden />
      <span className="brand-ethio">Ethio</span>
      <span className="brand-reco">Reco</span>
    </button>
  );
}
