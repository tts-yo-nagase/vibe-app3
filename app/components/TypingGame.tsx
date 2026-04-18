"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pickRandomWord } from "../data/words";
import styles from "./TypingGame.module.css";

type GameState = "ready" | "playing" | "finished";
type SubmitState = "idle" | "submitting" | "submitted" | "error";

type ScoreEntry = {
  id: string;
  name: string;
  score: number;
  accuracy: number;
  keys: number;
  createdAt: number;
};

const GAME_DURATION = 30;
const NAME_STORAGE_KEY = "typing-game:name";

export default function TypingGame() {
  const [gameState, setGameState] = useState<GameState>("ready");
  const [currentWord, setCurrentWord] = useState<string>("");
  const [typed, setTyped] = useState<string>("");
  const [score, setScore] = useState(0);
  const [totalKeys, setTotalKeys] = useState(0);
  const [missKeys, setMissKeys] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const inputRef = useRef<HTMLInputElement>(null);

  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
  const [totalPlays, setTotalPlays] = useState(0);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const [playerName, setPlayerName] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [myEntryId, setMyEntryId] = useState<string | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const res = await fetch("/api/scores", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.top ?? []);
        setTotalPlays(data.total ?? 0);
      }
    } catch {
      // ignore
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    const saved = typeof window !== "undefined"
      ? window.localStorage.getItem(NAME_STORAGE_KEY)
      : null;
    if (saved) setPlayerName(saved);
  }, [fetchLeaderboard]);

  const startGame = useCallback(() => {
    setCurrentWord(pickRandomWord());
    setTyped("");
    setScore(0);
    setTotalKeys(0);
    setMissKeys(0);
    setTimeLeft(GAME_DURATION);
    setSubmitState("idle");
    setMyEntryId(null);
    setMyRank(null);
    setGameState("playing");
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    if (gameState !== "playing") return;
    if (timeLeft <= 0) {
      setGameState("finished");
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [gameState, timeLeft]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gameState !== "playing") return;
    const next = e.target.value;
    const prevLength = typed.length;
    const addedLength = next.length - prevLength;

    if (addedLength > 0) {
      setTotalKeys((k) => k + addedLength);
      for (let i = 0; i < addedLength; i++) {
        const idx = prevLength + i;
        if (next[idx] !== currentWord[idx]) {
          setMissKeys((m) => m + 1);
        }
      }
    }

    if (currentWord.startsWith(next)) {
      if (next === currentWord) {
        setScore((s) => s + 1);
        setCurrentWord((w) => pickRandomWord(w));
        setTyped("");
      } else {
        setTyped(next);
      }
    }
  };

  const accuracy =
    totalKeys === 0 ? 100 : Math.round(((totalKeys - missKeys) / totalKeys) * 100);
  const progress = Math.max(0, Math.min(1, timeLeft / GAME_DURATION));
  const isUrgent = gameState === "playing" && timeLeft <= 5;

  const submitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitState === "submitting" || submitState === "submitted") return;
    setSubmitState("submitting");
    try {
      const name = playerName.trim() || "Anonymous";
      if (typeof window !== "undefined") {
        window.localStorage.setItem(NAME_STORAGE_KEY, name);
      }
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, score, accuracy, keys: totalKeys }),
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      setLeaderboard(data.top ?? []);
      setTotalPlays(data.total ?? 0);
      setMyEntryId(data.entry?.id ?? null);
      setMyRank(typeof data.rank === "number" ? data.rank : null);
      setSubmitState("submitted");
    } catch {
      setSubmitState("error");
    }
  };

  const percentile =
    myRank && totalPlays > 0
      ? Math.max(1, Math.round(((totalPlays - myRank + 1) / totalPlays) * 100))
      : null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.badge}>Typing Challenge</span>
        <h1 className={styles.title}>Speed Typer</h1>
        <p className={styles.subtitle}>
          {GAME_DURATION} 秒間でできるだけ多くの単語をタイプしよう
        </p>
      </header>

      <div className={styles.statsRow}>
        <div className={`${styles.stat} ${isUrgent ? styles.statDanger : ""}`}>
          <span className={styles.statLabel}>Time</span>
          <span className={styles.statValue}>{timeLeft}s</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Score</span>
          <span className={styles.statValue}>{score}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Accuracy</span>
          <span className={styles.statValue}>{accuracy}%</span>
        </div>
      </div>

      <div className={styles.progressTrack}>
        <div
          className={styles.progressBar}
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      {gameState === "ready" && (
        <div className={styles.centerBox}>
          <button className={styles.button} onClick={startGame}>
            START
          </button>
        </div>
      )}

      {gameState === "playing" && (
        <>
          <div className={styles.wordCard}>
            <div className={styles.wordRow}>
              {currentWord.split("").map((ch, i) => {
                const isTyped = i < typed.length;
                const isCurrent = i === typed.length;
                const cls = isTyped
                  ? styles.charTyped
                  : isCurrent
                  ? styles.charCurrent
                  : styles.charPending;
                return (
                  <span key={i} className={`${styles.char} ${cls}`}>
                    {ch}
                  </span>
                );
              })}
            </div>
          </div>
          <input
            ref={inputRef}
            className={styles.input}
            value={typed}
            onChange={handleChange}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="ここに入力..."
          />
        </>
      )}

      {gameState === "finished" && (
        <div className={styles.resultCard}>
          <h2 className={styles.resultTitle}>RESULT</h2>
          <div className={styles.resultGrid}>
            <div className={styles.resultStat}>
              <span className={styles.statLabel}>Score</span>
              <span className={styles.resultValue}>{score}</span>
            </div>
            <div className={styles.resultStat}>
              <span className={styles.statLabel}>Accuracy</span>
              <span className={styles.resultValue}>{accuracy}%</span>
            </div>
            <div className={styles.resultStat}>
              <span className={styles.statLabel}>Keys</span>
              <span className={styles.resultValue}>{totalKeys}</span>
            </div>
          </div>

          {submitState !== "submitted" ? (
            <form className={styles.submitForm} onSubmit={submitScore}>
              <input
                className={styles.nameInput}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="名前を入力 (最大20文字)"
                maxLength={20}
                disabled={submitState === "submitting"}
              />
              <button
                type="submit"
                className={styles.button}
                disabled={submitState === "submitting"}
              >
                {submitState === "submitting" ? "SAVING..." : "SAVE SCORE"}
              </button>
              {submitState === "error" && (
                <p className={styles.errorText}>保存に失敗しました。もう一度お試しください。</p>
              )}
            </form>
          ) : (
            <div className={styles.rankBox}>
              {myRank && myRank > 0 ? (
                <>
                  <div className={styles.rankLabel}>Your Rank</div>
                  <div className={styles.rankValue}>
                    #{myRank}
                    <span className={styles.rankOf}> / {totalPlays}</span>
                  </div>
                  {percentile !== null && (
                    <div className={styles.rankHint}>
                      上位 {100 - percentile + 1 > 100 ? 100 : 100 - percentile + 1}% 以内！
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.rankLabel}>スコアを保存しました</div>
              )}
            </div>
          )}

          <button className={styles.buttonGhost} onClick={startGame}>
            REPLAY
          </button>
        </div>
      )}

      <section className={styles.leaderboard}>
        <div className={styles.leaderboardHeader}>
          <h3 className={styles.leaderboardTitle}>Leaderboard</h3>
          <span className={styles.leaderboardMeta}>
            {totalPlays > 0 ? `${totalPlays} plays` : "まだプレイがありません"}
          </span>
        </div>

        {leaderboardLoading && leaderboard.length === 0 ? (
          <div className={styles.leaderboardEmpty}>読み込み中...</div>
        ) : leaderboard.length === 0 ? (
          <div className={styles.leaderboardEmpty}>
            最初のスコアを登録しよう！
          </div>
        ) : (
          <ol className={styles.rankList}>
            {leaderboard.map((entry, i) => {
              const rank = i + 1;
              const isMe = entry.id === myEntryId;
              const topClass =
                rank === 1
                  ? styles.rankGold
                  : rank === 2
                  ? styles.rankSilver
                  : rank === 3
                  ? styles.rankBronze
                  : "";
              return (
                <li
                  key={entry.id}
                  className={`${styles.rankItem} ${topClass} ${isMe ? styles.rankMine : ""}`}
                >
                  <span className={styles.rankNum}>#{rank}</span>
                  <span className={styles.rankName}>{entry.name}</span>
                  <span className={styles.rankAcc}>{entry.accuracy}%</span>
                  <span className={styles.rankScore}>{entry.score}</span>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
