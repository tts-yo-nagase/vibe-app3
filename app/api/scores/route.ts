import { NextResponse } from "next/server";
import { addScore, rankOf, readScores } from "../../lib/scores";

export const dynamic = "force-dynamic";

export async function GET() {
  const scores = await readScores();
  return NextResponse.json({
    top: scores.slice(0, 10),
    total: scores.length,
  });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, score, accuracy, keys } = (body ?? {}) as Record<string, unknown>;

  if (
    typeof name !== "string" ||
    typeof score !== "number" ||
    typeof accuracy !== "number" ||
    typeof keys !== "number"
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const cleanName = name.trim().slice(0, 20) || "Anonymous";
  const safeScore = Math.max(0, Math.floor(score));
  const safeAccuracy = Math.max(0, Math.min(100, Math.round(accuracy)));
  const safeKeys = Math.max(0, Math.floor(keys));

  const entry = await addScore({
    name: cleanName,
    score: safeScore,
    accuracy: safeAccuracy,
    keys: safeKeys,
  });

  const scores = await readScores();
  const rank = rankOf(scores, entry.id);

  return NextResponse.json({
    entry,
    rank,
    total: scores.length,
    top: scores.slice(0, 10),
  });
}
