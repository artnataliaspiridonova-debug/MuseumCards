import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { googleScriptGet } from "@/app/lib/google-leaderboard";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { userId } = await auth.protect();
  const period = request.nextUrl.searchParams.get("period") === "all" ? "all" : "month";
  const cityId = request.nextUrl.searchParams.get("cityId") || "";
  const museumId = request.nextUrl.searchParams.get("museumId") || "";

  try {
    const result = await googleScriptGet({
      action: "leaderboard",
      period,
      cityId,
      museumId,
      playerId: userId,
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
