import { NextRequest, NextResponse } from "next/server";
import { googleScriptPost } from "@/app/lib/google-leaderboard";

export const runtime = "nodejs";

type ResultRequest = {
  playerId?: unknown;
  nickname?: unknown;
  cityId?: unknown;
  museumId?: unknown;
  duration?: unknown;
  stages?: unknown;
};

export async function POST(request: NextRequest) {
  let body: ResultRequest;

  try {
    body = (await request.json()) as ResultRequest;
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  if (
    typeof body.playerId !== "string" ||
    typeof body.nickname !== "string" ||
    typeof body.cityId !== "string" ||
    typeof body.museumId !== "string" ||
    (body.duration !== "quick" && body.duration !== "full") ||
    typeof body.stages !== "number"
  ) {
    return NextResponse.json({ ok: false, error: "INVALID_RESULT" }, { status: 400 });
  }

  try {
    const result = await googleScriptPost({
      action: "saveResult",
      playerId: body.playerId,
      nickname: body.nickname,
      cityId: body.cityId,
      museumId: body.museumId,
      duration: body.duration,
      stages: body.stages,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    const status =
      message === "ALREADY_RECORDED_TODAY"
        ? 409
        : message === "LEADERBOARD_NOT_CONFIGURED"
          ? 503
          : 502;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
