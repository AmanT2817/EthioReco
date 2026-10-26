// EthioReco — Notify-When-Matched Service
// When a user has `notifyOnMatch=true` on a wishlist entry, this service
// scans for new cross-domain matches after each calibration run.
// Creates Notification records (capped at 1 per wishlisted item per day to avoid spam).

import { db } from "@/lib/db";
import { contentBasedSimilar } from "./content_based";

const MIN_MATCH_SIMILARITY = 0.15;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

interface MatchResult {
  wishlistedItemId: string;
  wishlistedItemTitle: string;
  matchedItemId: string;
  matchedItemTitle: string;
  matchedItemType: string;
  similarity: number;
}

// Scan a user's wishlist for items with notifyOnMatch=true, find new cross-domain matches
// that weren't previously notified about, and create Notification rows.
export async function scanWishlistForMatches(userId: string): Promise<number> {
  // Get wishlisted items with notifyOnMatch enabled, not notified in the last 24h
  const cutoff = new Date(Date.now() - ONE_DAY_MS);
  const wishlistEntries = await db.wishlist.findMany({
    where: {
      userId,
      notifyOnMatch: true,
      OR: [
        { lastNotifiedAt: null },
        { lastNotifiedAt: { lt: cutoff } },
      ],
    },
    include: { item: true },
  });

  if (wishlistEntries.length === 0) return 0;

  let notifCount = 0;
  for (const w of wishlistEntries) {
    // Find content-similar items in OTHER domains
    const similar = await contentBasedSimilar(w.itemId, 5);
    // Filter: must be from a different domain + meet threshold
    const crossDomainMatches: MatchResult[] = [];
    for (const s of similar) {
      if (s.similarity < MIN_MATCH_SIMILARITY) continue;
      const matchedItem = await db.item.findUnique({
        where: { id: s.itemId },
        select: { id: true, title: true, type: true },
      });
      if (!matchedItem || matchedItem.type === w.item.type) continue;
      crossDomainMatches.push({
        wishlistedItemId: w.itemId,
        wishlistedItemTitle: w.item.title,
        matchedItemId: matchedItem.id,
        matchedItemTitle: matchedItem.title,
        matchedItemType: matchedItem.type,
        similarity: s.similarity,
      });
    }

    // Take the top match (if any)
    if (crossDomainMatches.length === 0) continue;
    const topMatch = crossDomainMatches[0];
    // Don't notify if user has already rated this matched item
    const alreadyRated = await db.rating.findUnique({
      where: { userId_itemId: { userId, itemId: topMatch.matchedItemId } },
    });
    if (alreadyRated) continue;

    // Create the notification (with cinematic copy per the voice pack)
    await db.notification.create({
      data: {
        userId,
        type: "cross_domain_match",
        title: "Cross-domain match surfaced",
        body: `Because you wishlisted "${topMatch.wishlistedItemTitle}", we found a ${topMatch.matchedItemType} you might love: "${topMatch.matchedItemTitle}".`,
        itemId: topMatch.matchedItemId,
        matchScore: topMatch.similarity,
      },
    });
    // Update lastNotifiedAt to throttle future notifications on this wishlist entry
    await db.wishlist.update({
      where: { id: w.id },
      data: { lastNotifiedAt: new Date() },
    });
    notifCount++;
  }
  return notifCount;
}
