// EthioReco — Cold Start / Onboarding Seeder
// Converts survey selections into preference rows with weight=0.8 per spec,
// then surfaces initial recommendations seeded by those preferences.

import { db } from "@/lib/db";

export interface SurveySubmission {
  // Step 1: genres across 3 domains (>=3 total)
  bookGenres: string[];
  movieGenres: string[];
  musicGenres: string[];
  // Step 2: Ethiopian content toggle
  ethiopianPreference: boolean;
  // Step 3: primary medium ranking (book/movie/music in priority order)
  mediumRanking: ("book" | "movie" | "music")[];
  // Step 4: optional free-text favorites (cold-start seeding)
  favoriteTitles?: string;
}

const SURVEY_WEIGHT = 0.8;
const MAX_COLD_START_RECS = 5;

// Persist survey selections as preference rows + user-level flags
export async function seedPreferencesFromSurvey(
  userId: string,
  survey: SurveySubmission,
): Promise<void> {
  // User-level: ethiopian_preference + onboarding_completed + preferred medium
  await db.user.update({
    where: { id: userId },
    data: {
      ethiopianPreference: survey.ethiopianPreference,
      onboardingCompleted: true,
    },
  });

  // Genre preferences — apply weighting, scaled by medium rank position
  const rankWeight: Record<string, number> = {
    book: 1.0,
    movie: 0.9,
    music: 0.8,
  };
  survey.mediumRanking.forEach((medium, idx) => {
    // The user's top medium gets full weight, others slightly less
    rankWeight[medium] = 1.0 - idx * 0.1;
  });

  const prefs: { category: string; genre: string; weight: number }[] = [];
  for (const g of survey.bookGenres) {
    prefs.push({ category: "book", genre: g, weight: SURVEY_WEIGHT * rankWeight["book"] });
  }
  for (const g of survey.movieGenres) {
    prefs.push({ category: "movie", genre: g, weight: SURVEY_WEIGHT * rankWeight["movie"] });
  }
  for (const g of survey.musicGenres) {
    prefs.push({ category: "music", genre: g, weight: SURVEY_WEIGHT * rankWeight["music"] });
  }

  // Upsert each preference (UNIQUE constraint on user/category/genre)
  for (const p of prefs) {
    await db.preference.upsert({
      where: {
        userId_category_genre: {
          userId,
          category: p.category,
          genre: p.genre,
        },
      },
      create: {
        userId,
        category: p.category,
        genre: p.genre,
        weight: p.weight,
        source: "survey",
      },
      update: {
        weight: p.weight,
        source: "survey",
        updatedAt: new Date(),
      },
    });
  }

  // Award credit reward for completing onboarding (per spec: rating_reward)
  await awardOnboardingBonus(userId);
}

async function awardOnboardingBonus(userId: string): Promise<void> {
  // +20 credits for completing onboarding survey (encourages calibration signals)
  const BONUS = 20;
  const credit = await db.credit.upsert({
    where: { userId },
    create: { userId, balance: 100 + BONUS },
    update: { balance: { increment: BONUS } },
  });
  await db.creditTransaction.create({
    data: {
      userId,
      amount: BONUS,
      reason: "rating_reward",
    },
  });
  void credit; // unused
}

// Generate cold-start recommendations: items matching the user's seeded genres
export async function coldStartRecommendations(
  userId: string,
  limit = MAX_COLD_START_RECS,
): Promise<{ itemId: string; score: number; explanation: string }[]> {
  const prefs = await db.preference.findMany({
    where: { userId, source: "survey" },
    select: { category: true, genre: true, weight: true },
  });
  if (prefs.length === 0) return [];

  // Find items matching these genres (case-insensitive substring match)
  const items = await db.item.findMany({
    where: { status: "active" },
    select: { id: true, type: true, genre: true, ethiopianMetadata: true },
  });

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { ethiopianPreference: true },
  });

  const scored: { itemId: string; score: number; explanation: string }[] = [];
  for (const it of items) {
    if (!it.genre) continue;
    let bestWeight = 0;
    let bestCategory = "";
    const itemGenres = it.genre.toLowerCase().split(/[\/,|]/).map((g) => g.trim());
    for (const p of prefs) {
      if (p.category !== it.type) continue;
      const pGenre = p.genre.toLowerCase();
      if (itemGenres.some((g) => g.includes(pGenre) || pGenre.includes(g))) {
        if (p.weight > bestWeight) {
          bestWeight = p.weight;
          bestCategory = p.category;
        }
      }
    }
    if (bestWeight === 0) continue;
    // Apply cultural boost if applicable
    let score = bestWeight;
    let cultural = false;
    if (user?.ethiopianPreference && it.ethiopianMetadata?.isTraditional) {
      score = Math.min(1, score * 1.3);
      cultural = true;
    }
    scored.push({
      itemId: it.id,
      score,
      explanation: cultural
        ? "Featured Ethiopian content matching your cultural preference"
        : `Seeded from your ${bestCategory} preference — keep rating to sharpen this`,
    });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
