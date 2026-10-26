// POST /api/onboarding — submit survey → seed preferences + trigger initial calibration
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/auth";
import { seedPreferencesFromSurvey, type SurveySubmission } from "@/rec_engine/cold_start";
import { calibrateUserTaste } from "@/rec_engine/hybrid";
import { z } from "zod";

const SurveySchema = z.object({
  bookGenres: z.array(z.string()).min(0).max(10),
  movieGenres: z.array(z.string()).min(0).max(10),
  musicGenres: z.array(z.string()).min(0).max(10),
  ethiopianPreference: z.boolean(),
  mediumRanking: z.array(z.enum(["book", "movie", "music"])).length(3),
  favoriteTitles: z.string().max(500).optional(),
}) as z.ZodType<SurveySubmission>;

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign in to begin discovery" } },
      { status: 401 },
    );
  }
  if (user.onboardingCompleted) {
    return NextResponse.json(
      { error: { code: "ALREADY_ONBOARDED", message: "Onboarding already complete" } },
      { status: 409 },
    );
  }
  const body = await req.json();
  const parsed = SurveySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: parsed.error.issues[0].message } },
      { status: 400 },
    );
  }
  const totalGenres = parsed.data.bookGenres.length + parsed.data.movieGenres.length + parsed.data.musicGenres.length;
  if (totalGenres < 3) {
    return NextResponse.json(
      { error: { code: "VALIDATION", message: "Pick at least 3 genres total" } },
      { status: 400 },
    );
  }

  await seedPreferencesFromSurvey(user.id, parsed.data);
  // Trigger initial calibration so the dashboard has recs immediately
  try {
    await calibrateUserTaste(user.id);
  } catch (err) {
    // Non-fatal — dashboard will show "Calibrating..." and retry on next load
    console.error("[onboarding] calibration failed:", err);
  }
  return NextResponse.json({
    data: { onboarded: true },
    meta: { message: "Welcome to EthioReco — your taste is now calibrated" },
    errors: [],
  });
}
