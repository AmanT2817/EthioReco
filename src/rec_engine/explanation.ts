// EthioReco — Explanation Generator
// Generates "Because you liked X" reasons per recommendation.

export type ExplanationKind =
  | "content"
  | "collab"
  | "hybrid"
  | "cross_domain"
  | "cultural"
  | "cold_start"
  | "popular";

export interface ExplanationInput {
  kind: ExplanationKind;
  seedItemTitle?: string;
  seedItemScore?: number;
  sourceDomain?: string; // for cross-domain
  culturalRegion?: string;
  traditionalGenre?: string;
}

export function generateExplanation(input: ExplanationInput): string {
  switch (input.kind) {
    case "content":
      if (input.seedItemTitle) {
        const starText = input.seedItemScore
          ? `${Math.round(input.seedItemScore)} star${input.seedItemScore >= 2 ? "s" : ""}`
          : "highly";
        return `Because you rated ${input.seedItemTitle} ${starText}`;
      }
      return "Matches the textures you’ve rated highly";
    case "collab":
      return "People with similar taste liked this";
    case "hybrid":
      if (input.seedItemTitle) {
        return `Because you liked ${input.seedItemTitle} — and so did viewers like you`;
      }
      return "Calibrated from your taste and viewers like you";
    case "cross_domain":
      if (input.sourceDomain && input.seedItemTitle) {
        return `Cross-domain match from your ${input.sourceDomain} taste — seeded by ${input.seedItemTitle}`;
      }
      return "Cross-domain match from your preferences";
    case "cultural":
      if (input.traditionalGenre && input.culturalRegion) {
        return `Featured Ethiopian ${input.traditionalGenre} content from ${input.culturalRegion} matching your cultural preference`;
      }
      if (input.traditionalGenre) {
        return `Featured Ethiopian ${input.traditionalGenre} content matching your cultural preference`;
      }
      return "Featured Ethiopian content matching your cultural preference";
    case "cold_start":
      return "Seeded from your onboarding survey — keep rating to sharpen this";
    case "popular":
      return "Highly rated across EthioReco — a place to start";
    default:
      return "Recommended for you";
  }
}
