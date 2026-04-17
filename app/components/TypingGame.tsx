"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pickRandomWord } from "../data/words";
import styles from "./TypingGame.module.css";

type GameState = "ready" | "playing" | "finished";

const GAME_DURATION = 30;

export default function TypingGame() {
  const [gameState, setGameState] = useState<GameState>("ready");
  const [currentWord, setCurrentWord] = useState<string>("");
  const [typed, setTyped] = useState<string>("");
  const [score, setScore] = useState(0);
  const [totalKeys, setTotalKeys] = useState(0);
  const [missKeys, setMissKeys] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const inputRef = useRef<HTMLInputElement>(null);

  const startGame = useCallback(() => {
    setCurrentWord(pickRandomWord());
    setTyped("");
    setScore(0);
    setTotalKeys(0);
    setMissKeys(0);
    setTimeLeft(GAME_DURATION);
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
          <button className={styles.button} onClick={startGame}>
            REPLAY
          </button>
        </div>
      )}
    </div>
  );
}
