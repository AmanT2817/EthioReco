// EthioReco — Cultural Boost
// Per Q&A doc: 1.3x ranking multiplier for Ethiopian content
// when user has ethiopian_preference=true.

import { db } from "@/lib/db";

export const ETHIOPIAN_BOOST_MULTIPLIER = 1.3;

export async function applyCulturalBoost(
  userId: string,
  itemId: string,
  rawScore: number,
): Promise<{ boostedScore: number; applied: boolean }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { ethiopianPreference: true },
  });
  if (!user?.ethiopianPreference) return { boostedScore: rawScore, applied: false };

  const ethMeta = await db.ethiopianMetadata.findUnique({
    where: { itemId },
    select: { isTraditional: true },
  });
  if (!ethMeta?.isTraditional) return { boostedScore: rawScore, applied: false };

  // Note: this is a RANKING preference, not a quality claim.
  // Document this clearly: per Q&A doc, this only reorders results, doesn't imply quality.
  return {
    boostedScore: Math.min(1, rawScore * ETHIOPIAN_BOOST_MULTIPLIER),
    applied: true,
  };
}
