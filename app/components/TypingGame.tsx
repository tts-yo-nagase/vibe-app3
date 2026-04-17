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

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>タイピングゲーム</h1>
      <p className={styles.subtitle}>
        制限時間 {GAME_DURATION} 秒でできるだけ多くの単語をタイプしよう！
      </p>

      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>時間</span>
          <span className={styles.statValue}>{timeLeft}s</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>スコア</span>
          <span className={styles.statValue}>{score}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>正確率</span>
          <span className={styles.statValue}>{accuracy}%</span>
        </div>
      </div>

      {gameState === "ready" && (
        <div className={styles.centerBox}>
          <button className={styles.button} onClick={startGame}>
            スタート
          </button>
        </div>
      )}

      {gameState === "playing" && (
        <>
          <div className={styles.wordBox}>
            {currentWord.split("").map((ch, i) => {
              const isTyped = i < typed.length;
              const isCurrent = i === typed.length;
              return (
                <span
                  key={i}
                  className={
                    isTyped
                      ? styles.charTyped
                      : isCurrent
                      ? styles.charCurrent
                      : styles.charPending
                  }
                >
                  {ch}
                </span>
              );
            })}
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
        <div className={styles.centerBox}>
          <h2 className={styles.resultTitle}>結果</h2>
          <div className={styles.resultGrid}>
            <div>
              <div className={styles.statLabel}>スコア</div>
              <div className={styles.resultValue}>{score}</div>
            </div>
            <div>
              <div className={styles.statLabel}>正確率</div>
              <div className={styles.resultValue}>{accuracy}%</div>
            </div>
            <div>
              <div className={styles.statLabel}>打鍵数</div>
              <div className={styles.resultValue}>{totalKeys}</div>
            </div>
          </div>
          <button className={styles.button} onClick={startGame}>
            もう一度
          </button>
        </div>
      )}
    </div>
  );
}
