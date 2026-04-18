import { promises as fs } from "fs";
import path from "path";

export type ScoreEntry = {
  id: string;
  name: string;
  score: number;
  accuracy: number;
  keys: number;
  createdAt: number;
};

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "scores.json");
const MAX_ENTRIES = 500;

async function ensureFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf8");
  }
}

export async function readScores(): Promise<ScoreEntry[]> {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function addScore(
  entry: Omit<ScoreEntry, "id" | "createdAt">
): Promise<ScoreEntry> {
  const scores = await readScores();
  const record: ScoreEntry = {
    ...entry,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  scores.push(record);
  scores.sort(
    (a, b) => b.score - a.score || b.accuracy - a.accuracy || a.createdAt - b.createdAt
  );
  const trimmed = scores.slice(0, MAX_ENTRIES);
  await fs.writeFile(DATA_FILE, JSON.stringify(trimmed, null, 2), "utf8");
  return record;
}

export function rankOf(scores: ScoreEntry[], id: string): number {
  const idx = scores.findIndex((s) => s.id === id);
  return idx >= 0 ? idx + 1 : -1;
}
