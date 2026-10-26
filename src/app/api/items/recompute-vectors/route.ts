// POST /api/items/recompute-vectors — refit + persist all item vectors
import { NextResponse } from "next/server";
import { recomputeAllItemVectors } from "@/rec_engine/content_based";

export async function POST() {
  const count = await recomputeAllItemVectors();
  return NextResponse.json({
    data: { vectorizedCount: count },
    meta: { recomputeAt: new Date().toISOString() },
    errors: [],
  });
}
