import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { googleScriptPost } from "@/app/lib/google-leaderboard";

export const runtime = "nodejs";

type ResultRequest = {
  action?: unknown;
  playerId?: unknown;
  nickname?: unknown;
  cityName?: unknown;
  museumName?: unknown;
  duration?: unknown;
  stages?: unknown;
  qualifiedStages?: unknown;
  answerCount?: unknown;
  photoCount?: unknown;
  routeId?: unknown;
  bonusType?: unknown;
};

export async function POST(request: NextRequest) {
  const { userId } = await auth.protect();
  let body: ResultRequest;

  try {
    body = (await request.json()) as ResultRequest;
  } catch {
    return NextResponse.json({ ok: false, error: "INVALID_JSON" }, { status: 400 });
  }

  if (body.action === "addBonus") {
    if (
      typeof body.routeId !== "string" ||
      (body.bonusType !== "download" && body.bonusType !== "share")
    ) {
      return NextResponse.json({ ok: false, error: "INVALID_BONUS" }, { status: 400 });
    }
    try {
      const result = await googleScriptPost({
        action: "addBonus",
        playerId: userId,
        routeId: body.routeId,
        bonusType: body.bonusType,
      });
      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
      return NextResponse.json({ ok: false, error: message }, { status: 502 });
    }
  }

  if (
    typeof body.nickname !== "string" ||
    typeof body.cityName !== "string" ||
    typeof body.museumName !== "string" ||
    (body.duration !== "quick" && body.duration !== "full") ||
    typeof body.stages !== "number" ||
    typeof body.qualifiedStages !== "number" ||
    typeof body.answerCount !== "number" ||
    typeof body.photoCount !== "number"
  ) {
    return NextResponse.json({ ok: false, error: "INVALID_RESULT" }, { status: 400 });
  }

  try {
    const result = await googleScriptPost({
      action: "saveResult",
      playerId: userId,
      nickname: body.nickname,
      cityName: body.cityName,
      museumName: body.museumName,
      duration: body.duration,
      stages: body.stages,
      qualifiedStages: body.qualifiedStages,
      answerCount: body.answerCount,
      photoCount: body.photoCount,
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
