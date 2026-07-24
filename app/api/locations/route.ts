import { NextResponse } from "next/server";
import { googleScriptGet } from "@/app/lib/google-leaderboard";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await googleScriptGet({ action: "locations" });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status = message === "LEADERBOARD_NOT_CONFIGURED" ? 503 : 502;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
