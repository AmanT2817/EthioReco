// EthioReco — Bilingual text component
// Designed-in dual-language experience (Amharic primary on Ethiopian content per spec)
// Falls back gracefully for non-Ethiopian content (English only)

import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";

interface BilingualTextProps {
  english?: string | null;
  amharic?: string | null;
  variant?: "primary-amharic" | "primary-english" | "stacked" | "auto";
  className?: string;
  amharicClassName?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

export function BilingualText({
  english,
  amharic,
  variant = "auto",
  className,
  amharicClassName,
  as = "p",
}: BilingualTextProps) {
  const language = useAppStore((s) => s.language);
  const Tag = as;

  // Auto: if user is in Amharic mode OR the item is Ethiopian (amharic present), Amharic gets primary
  const showAmharicPrimary =
    variant === "primary-amharic" ||
    (variant === "auto" && (language === "am" || (amharic && !english)));

  if (variant === "stacked" && amharic && english) {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <Tag className={cn("amharic font-amharic leading-tight", amharicClassName)}>{amharic}</Tag>
        <Tag className="text-sm text-ash opacity-80">{english}</Tag>
      </div>
    );
  }

  if (showAmharicPrimary && amharic) {
    return (
      <Tag className={cn("amharic font-amharic", className)}>
        {amharic}
        {english && (
          <span className="block text-sm text-ash opacity-70 mt-1 font-sans">{english}</span>
        )}
      </Tag>
    );
  }

  return <Tag className={className}>{english ?? amharic ?? ""}</Tag>;
}
