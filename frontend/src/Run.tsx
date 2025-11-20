import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Loading from "./Components/Loading";
import { useDataReady } from "./lib/useDataReady";
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
  // Use refs for internal counters (no direct UI read required)
  const completedCountRef = useRef<number>(0);
  const streakRef = useRef<number>(0);
  const [ownedBadges, setOwnedBadges] = useState<Set<string>>(new Set());
  const [badgesLoaded, setBadgesLoaded] = useState<boolean>(false);

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
      setBadgesLoaded(true);
      return;
    }
    let cancelled = false;
    api
      .getMyBadges()
      .then((badges) => {
        if (!cancelled) {
          setOwnedBadges(new Set(badges.map((badge) => badge.code)));
          setBadgesLoaded(true);
        }
      })
      .catch((err) => {
        console.error("Failed to load badges:", err);
        setBadgesLoaded(true);
      });
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
      // Update counters & award badges
      completedCountRef.current += 1;
      if (completedCountRef.current === 1) maybeAward("FIRST_STEPS");
      if (completedCountRef.current === 20) maybeAward("SURVIVOR");
      streakRef.current += 1;
      if (streakRef.current === 10) maybeAward("PERFECT_10");
      // Check for speed demon badge (more than 5 seconds remaining)
      if (timeRemaining > 5) {
        maybeAward("SPEED_DEMON");
      }
      // Save coins to backend when signed in
      if (!isGuest) {
        api.incrementCoins(reward).catch((err) => console.error("Failed to save coins:", err));
      }
    } else {
      streakRef.current = 0;
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
    completedCountRef.current = 0;
    streakRef.current = 0;
  };

  const handleStartOver = () => {
    handleStart();
  };

  const ready = useDataReady([!isLoading, badgesLoaded]);
  if (!ready) return <Loading />;

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
