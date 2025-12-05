import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Loading from "./Components/Loading";
import Minigames from "./Components/Minigames";
import GameplayLayout from "./Components/GameplayLayout";
import { getRandomMinigames } from "./Components/minigamesData";
import type { Minigame } from "./Components/types";
import { Link } from "react-router-dom";
import { useSfxVolume } from "./lib/sfxVolume";
import { playDoodleSound } from "./lib/doodleSound";
import yaySound from "./assets/sound/yay.wav";

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

const multiplierForDifficulty = (level: string): number => {
  switch (level) {
    case "easy":
      return 0.75;
    case "hard":
      return 1.25;
    case "normal":
    default:
      return 1;
  }
};

const readDifficultyLevel = (): string => {
  if (typeof window === "undefined") {
    return "normal";
  }
  return localStorage.getItem("difficultyLevel") || "normal";
};

// Get a representative minigame for each type
const getMinigameOptions = (): Minigame[] => {
  const allMinigames = getRandomMinigames();
  // Create a map to deduplicate by ID, keeping one of each type
  const minigameMap = new Map<string, Minigame>();

  allMinigames.forEach((minigame) => {
    if (!minigameMap.has(minigame.id)) {
      minigameMap.set(minigame.id, minigame);
    }
  });

  return Array.from(minigameMap.values());
};

const MinigameSelect = () => {
  const { user, isLoading, isAuthenticated } = useAuth0();
  const isGuest = !isAuthenticated;
  const [selectedMinigame, setSelectedMinigame] = useState<Minigame | null>(null);
  const [coins, setCoins] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [lives, setLives] = useState<number>(3);
  const [configuredMinigameTime, setConfiguredMinigameTime] = useState<number>(() => timeForDifficulty(readDifficultyLevel()));
  const [timeRemaining, setTimeRemaining] = useState<number>(() => timeForDifficulty(readDifficultyLevel()));
  const [difficultyLevel, setDifficultyLevel] = useState<string>(() => readDifficultyLevel());
  const [notification, setNotification] = useState<string>("");
  const notificationTimeoutRef = useRef<number | null>(null);
  const [minigamesCompleted, setMinigamesCompleted] = useState<number>(0);
  const [freezeTimer, setFreezeTimer] = useState<boolean>(false);
  const [avatarMood, setAvatarMood] = useState<"neutral" | "happy" | "sad">("neutral");
  const avatarMoodTimeoutRef = useRef<number | null>(null);
  const sfxVolume = useSfxVolume();

  const minigameOptions = getMinigameOptions();

  const resetAvatarMood = () => {
    if (avatarMoodTimeoutRef.current !== null) {
      window.clearTimeout(avatarMoodTimeoutRef.current);
      avatarMoodTimeoutRef.current = null;
    }
    setAvatarMood("neutral");
  };

  const flashAvatarMood = (mood: "happy" | "sad", persist: boolean = false) => {
    if (avatarMoodTimeoutRef.current !== null) {
      window.clearTimeout(avatarMoodTimeoutRef.current);
      avatarMoodTimeoutRef.current = null;
    }
    setAvatarMood(mood);
    if (!persist) {
      avatarMoodTimeoutRef.current = window.setTimeout(() => {
        setAvatarMood("neutral");
        avatarMoodTimeoutRef.current = null;
      }, 1200);
    }
  };

  const playSample = useCallback(
    (src: string) => {
      if (sfxVolume <= 0) {
        return;
      }
      try {
        const audio = new Audio(src);
        audio.volume = Math.min(1, Math.max(0, sfxVolume));
        void audio.play().catch(() => undefined);
      } catch (error) {
        console.error(`Failed to play sound: ${src}`, error);
      }
    },
    [sfxVolume]
  );

  const playWinSound = useCallback(() => {
    playSample(yaySound);
  }, [playSample]);

  const playLoseLifeSound = useCallback(async () => {
    await playDoodleSound(Math.min(1, Math.max(0, sfxVolume)));
  }, [sfxVolume]);

  const handleComplete = (success: boolean, reward: number) => {
    if (success) {
      playWinSound();
      flashAvatarMood("happy");
      // Apply difficulty multiplier to reward
      const multiplier = multiplierForDifficulty(difficultyLevel);
      const adjustedReward = Math.round(reward * multiplier);
      setCoins((c) => c + adjustedReward);

      const newCount = minigamesCompleted + 1;
      setMinigamesCompleted(newCount);

      if (newCount % 5 === 0 && configuredMinigameTime > 5) {
        const newTime = configuredMinigameTime - 2;
        setConfiguredMinigameTime(newTime);
        setTimeRemaining(newTime);
        if (notificationTimeoutRef.current !== null) {
          window.clearTimeout(notificationTimeoutRef.current);
        }
        setFreezeTimer(true);
        setNotification("Time Reduced!");
        notificationTimeoutRef.current = window.setTimeout(() => {
          setNotification("");
          notificationTimeoutRef.current = null;
          setFreezeTimer(false);
        }, 1000);
      }
    } else {
      void playLoseLifeSound();
      setLives((l) => {
        const nextLives = l - 1;
        if (nextLives <= 0) {
          flashAvatarMood("sad", true);
          setGameOver(true);
          return 0;
        }
        flashAvatarMood("sad");
        if (notificationTimeoutRef.current !== null) {
          window.clearTimeout(notificationTimeoutRef.current);
        }
        setFreezeTimer(true);
        setNotification("-1 Life");
        notificationTimeoutRef.current = window.setTimeout(() => {
          setNotification("");
          notificationTimeoutRef.current = null;
          setFreezeTimer(false);
        }, 1000);
        return nextLives;
      });
    }
  };

  const freshCopy = (minigame: Minigame): Minigame => ({
    ...minigame,
    shapes: minigame.shapes.map((shape) => ({ ...shape })),
  });

  const handleMinigameSelect = (minigame: Minigame) => {
    const currentDifficulty = readDifficultyLevel();
    const latestTime = timeForDifficulty(currentDifficulty);
    setDifficultyLevel(currentDifficulty);
    setConfiguredMinigameTime(latestTime);
    setTimeRemaining(latestTime);
    setSelectedMinigame(freshCopy(minigame));
    setGameOver(false);
    setCoins(0);
    setLives(3);
    setMinigamesCompleted(0);
    setFreezeTimer(false);
    resetAvatarMood();
    if (notificationTimeoutRef.current !== null) {
      window.clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = null;
    }
    setNotification("");
  };

  const handleBackToSelect = () => {
    setSelectedMinigame(null);
    setGameOver(false);
    setCoins(0);
    setLives(3);
    setMinigamesCompleted(0);
    setFreezeTimer(false);
    resetAvatarMood();
    if (notificationTimeoutRef.current !== null) {
      window.clearTimeout(notificationTimeoutRef.current);
      notificationTimeoutRef.current = null;
    }
    setNotification("");
  };

  const handlePlayAgain = () => {
    if (!selectedMinigame) return;
    handleMinigameSelect(selectedMinigame);
  };

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current !== null) {
        window.clearTimeout(notificationTimeoutRef.current);
      }
      if (avatarMoodTimeoutRef.current !== null) {
        window.clearTimeout(avatarMoodTimeoutRef.current);
      }
    };
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <GameplayLayout
      lives={lives}
      timeRemaining={timeRemaining}
      userName={user?.name ?? (isGuest ? "Guest" : undefined)}
      notification={notification}
      avatarMood={avatarMood}
    >
      {!selectedMinigame ? (
        <div className="flex flex-col h-full justify-around items-center p-8">
          <h2 className="text-header font-header text-skrawl-purple">Select a Minigame</h2>
          {isGuest && <p className="text-body font-body text-skrawl-purple">Playing as Guest (progress won&apos;t save)</p>}
          <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
            {minigameOptions.map((minigame) => (
              <button
                key={minigame.id}
                onClick={() => handleMinigameSelect(minigame)}
                className="bg-skrawl-purple text-skrawl-white p-6 rounded-lg hover:bg-skrawl-magenta transition-colors font-body text-body"
              >
                <h3 className="font-header text-body mb-2">{minigame.name}</h3>
                <p className="text-sm">Reward: {minigame.totalReward} coins</p>
              </button>
            ))}
          </div>
          <Link to="/" className="text-body font-body text-skrawl-purple hover:text-skrawl-magenta transition-colors">
            Back to Home
          </Link>
        </div>
      ) : !gameOver ? (
        <div className="w-full h-full relative">
          <Minigames
            onComplete={handleComplete}
            onGameOver={() => {
              void playLoseLifeSound();
              flashAvatarMood("sad", true);
              setGameOver(true);
            }}
            onTimeUpdate={setTimeRemaining}
            initialTime={configuredMinigameTime}
            specificMinigame={selectedMinigame}
            skipCountdown={minigamesCompleted > 0 || notification !== ""}
            freezeTimer={freezeTimer}
          />
        </div>
      ) : (
        <div className="game-over h-full flex flex-col items-center justify-center text-body font-body text-skrawl-purple gap-3">
          <h2 className="text-logotype font-logotype">Game Over!</h2>
          <div className="flex items-center gap-2">
            <img src="./src/assets/svgs/coin.png" alt="Coins earned" className="h-8 w-8 object-contain" />
            <span className="text-header font-header">{coins}</span>
          </div>
          <p className="text-sm opacity-75">
            Difficulty: {difficultyLevel.charAt(0).toUpperCase() + difficultyLevel.slice(1)} ({multiplierForDifficulty(difficultyLevel)}x multiplier)
          </p>
          <button onClick={handlePlayAgain} className="text-skrawl-purple hover:text-skrawl-magenta transition-colors pt-2">
            Play Again
          </button>
          <button onClick={handleBackToSelect} className="text-skrawl-purple hover:text-skrawl-magenta transition-colors pt-2">
            Back to Selection
          </button>
        </div>
      )}
    </GameplayLayout>
  );
};

export default MinigameSelect;
