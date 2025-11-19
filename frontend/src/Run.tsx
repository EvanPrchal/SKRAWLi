import { useState, useEffect, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Loading from "./Components/Loading";
import Minigames from "./Components/Minigames";
import GameplayLayout from "./Components/GameplayLayout";
import { Link } from "react-router-dom";
import { useApi } from "./lib/api";

const timeForDifficulty = (level: string): number => {
  switch (level) {
    case "easy":
      return 20;
    case "hard":
      return 10;
    case "normal":
    default:
      return 15;
  }
};

const readDifficultyLevel = (): string => {
  if (typeof window === "undefined") {
    return "normal";
  }
  return localStorage.getItem("difficultyLevel") || "normal";
};

const Run = () => {
  const { user, isLoading, isAuthenticated } = useAuth0();
  const isGuest = !isAuthenticated;
  const api = useApi();
  const [started, setStarted] = useState<boolean>(false);
  const [coins, setCoins] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [lives, setLives] = useState<number>(3);
  const [configuredMinigameTime, setConfiguredMinigameTime] = useState<number>(() => timeForDifficulty(readDifficultyLevel()));
  const [timeRemaining, setTimeRemaining] = useState<number>(() => timeForDifficulty(readDifficultyLevel()));
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [ownedBadges, setOwnedBadges] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("currentGameTime", timeRemaining.toString());
    }
  }, [timeRemaining]);

  // Listen for settings updates (difficulty changes) and update minigame time
  useEffect(() => {
    const onSettings = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const level = detail.difficultyLevel || readDifficultyLevel();

      const nextTime = timeForDifficulty(level);
      setConfiguredMinigameTime(nextTime);
      setTimeRemaining(nextTime);
    };

    window.addEventListener("settingsUpdated", onSettings as EventListener);
    return () => window.removeEventListener("settingsUpdated", onSettings as EventListener);
  }, []);

  // Load user's badges on mount
  useEffect(() => {
    if (isGuest) {
      setOwnedBadges(new Set());
      return;
    }

    let cancelled = false;
    api
      .getMyBadges()
      .then((badges) => {
        if (!cancelled) {
          setOwnedBadges(new Set(badges.map((badge) => badge.code)));
        }
      })
      .catch((err) => console.error("Failed to load badges:", err));

    return () => {
      cancelled = true;
    };
  }, [api, isGuest]);

  const maybeAward = useCallback(
    (code: string) => {
      if (isGuest || ownedBadges.has(code)) {
        return;
      }
      api
        .awardBadge(code)
        .then((res) => {
          if (res.status === "awarded" || res.status === "exists") {
            setOwnedBadges((prev) => new Set([...prev, code]));
          }
        })
        .catch((err) => console.error(`Failed to award badge ${code}:`, err));
    },
    [api, isGuest, ownedBadges]
  );

  const handleComplete = (success: boolean, reward: number) => {
    if (success) {
      setCoins((c) => {
        const next = c + reward;
        if (next >= 50) {
          maybeAward("COIN_COLLECTOR");
        }
        return next;
      });
      setCompletedCount((count) => {
        const next = count + 1;
        if (next === 1) {
          maybeAward("FIRST_STEPS");
        }
        if (next === 20) {
          maybeAward("SURVIVOR");
        }
        return next;
      });
      setStreak((currentStreak) => {
        const next = currentStreak + 1;
        if (next === 10) {
          maybeAward("PERFECT_10");
        }
        return next;
      });
      // Check for speed demon badge (more than 5 seconds remaining)
      if (timeRemaining > 5) {
        maybeAward("SPEED_DEMON");
      }
      // Save coins to backend when signed in
      if (!isGuest) {
        api.incrementCoins(reward).catch((err) => console.error("Failed to save coins:", err));
      }
    } else {
      setStreak(0);
      setLives((l) => {
        const nextLives = l - 1;
        if (nextLives <= 0) {
          setGameOver(true);
          return 0;
        }
        return nextLives;
      });
    }
  };

  const handleStart = () => {
    const latestTime = timeForDifficulty(readDifficultyLevel());
    setConfiguredMinigameTime(latestTime);
    setTimeRemaining(latestTime);
    setStarted(true);
    setGameOver(false);
    setCoins(0);
    setLives(3);
    setCompletedCount(0);
    setStreak(0);
  };

  const handleStartOver = () => {
    handleStart();
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <GameplayLayout lives={lives} timeRemaining={timeRemaining} userImage={user?.picture} userName={user?.name ?? (isGuest ? "Guest" : undefined)}>
      {!started ? (
        <div className="flex flex-col h-full justify-center items-center gap-4">
          {isGuest && <p className="text-body font-body text-skrawl-purple">Playing as Guest (progress won&apos;t save)</p>}
          <button
            onClick={handleStart}
            className="text-logotype font-logotype text-skrawl-purple hover:cursor-pointer hover:text-skrawl-magenta transition-colors"
          >
            Start Game
          </button>
          <Link to="/" className="text-body font-body text-skrawl-purple hover:text-skrawl-magenta transition-colors">
            Back to Home
          </Link>
        </div>
      ) : !gameOver ? (
        <div className="w-full h-full relative">
          <Minigames
            onComplete={handleComplete}
            onGameOver={() => {
              setGameOver(true);
            }}
            onTimeUpdate={setTimeRemaining}
            initialTime={configuredMinigameTime}
          />
        </div>
      ) : (
        <div className="game-over h-full flex flex-col items-center justify-center text-body font-body text-skrawl-purple gap-2">
          <h2 className="text-logotype font-logotype">Game Over!</h2>
          <p>Coins earned: {coins}</p>
          <button onClick={handleStartOver} className="text-skrawl-purple hover:text-skrawl-magenta transition-colors">
            Play Again
          </button>
          <Link to="/" className="text-body font-body text-skrawl-purple hover:text-skrawl-magenta transition-colors">
            Back to Home
          </Link>
        </div>
      )}
    </GameplayLayout>
  );
};

export default Run;
