// EthioReco — Star Rating Widget
// 5-star with half-star increments, 120ms staggered fill on change

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number; // 0 - 5 (multiples of 0.5)
  onChange?: (v: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
}

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "md",
  showScore = false,
}: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const sizeClass = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-6 w-6",
  }[size];

  const display = hover ?? value;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          // Half-star precision: 0.5 if current star is partial
          const filled = display >= star;
          const halfFilled = !filled && display >= star - 0.5;
          return (
            <button
              key={star}
              type="button"
              disabled={readOnly}
              onMouseEnter={() => !readOnly && setHover(star)}
              onMouseLeave={() => !readOnly && setHover(null)}
              onClick={() => !readOnly && onChange?.(star === value ? star - 0.5 : star)}
              className={cn(
                "relative",
                !readOnly && "cursor-pointer",
                "transition-transform",
                (filled || halfFilled) && "star-fill",
              )}
              style={{ animationDelay: `${star * 60}ms` }}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
            >
              <Star
                className={cn(
                  sizeClass,
                  "transition-colors",
                  filled ? "fill-ember text-ember" : halfFilled ? "fill-ember/50 text-ember" : "text-ash/40",
                )}
                strokeWidth={1.5}
              />
            </button>
          );
        })}
      </div>
      {showScore && (
        <span className="match-score text-xs text-ash ml-1.5">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}
