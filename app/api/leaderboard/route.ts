import { NextRequest, NextResponse } from "next/server";
import { googleScriptGet } from "@/app/lib/google-leaderboard";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const period = request.nextUrl.searchParams.get("period") === "all" ? "all" : "month";
  const cityId = request.nextUrl.searchParams.get("cityId") || "";
  const museumId = request.nextUrl.searchParams.get("museumId") || "";
  const playerId = request.nextUrl.searchParams.get("playerId") || "";

  if (!cityId && !museumId) {
    return NextResponse.json({ ok: false, error: "LOCATION_REQUIRED" }, { status: 400 });
  }

  try {
    const result = await googleScriptGet({
      action: "leaderboard",
      period,
      cityId,
      museumId,
      playerId,
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status = message === "LEADERBOARD_NOT_CONFIGURED" ? 503 : 502;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
