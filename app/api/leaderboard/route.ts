import { NextRequest, NextResponse } from "next/server";
import { googleScriptGet } from "@/app/lib/google-leaderboard";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const period = request.nextUrl.searchParams.get("period") === "all" ? "all" : "month";
  const cityId = request.nextUrl.searchParams.get("cityId") || "";
  const museumId = request.nextUrl.searchParams.get("museumId") || "";
  const playerId = request.nextUrl.searchParams.get("playerId") || "";

  try {
    const result = await googleScriptGet({
      action: "leaderboard",
      period,
      cityId,
      museumId,
      playerId,
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status = message === "LEADERBOARD_NOT_CONFIGURED" ? 503 : 502;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
