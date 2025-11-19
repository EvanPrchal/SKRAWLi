import React, { useState, useEffect, useCallback } from "react";
import type { Minigame } from "./types";
import { getRandomMinigames } from "./minigamesData";
import TraceCanvas from "./TraceCanvas";

interface MinigamesProps {
  onComplete: (success: boolean, reward: number) => void;
  onGameOver: () => void;
  onTimeUpdate: (time: number) => void;
  initialTime?: number;
  specificMinigame?: Minigame; // Optional: start with a specific minigame
}

const MINIGAME_TIME = 10; // default seconds per minigame

const Minigames: React.FC<MinigamesProps> = ({ onComplete, onGameOver, onTimeUpdate, initialTime, specificMinigame }) => {
  // Function to get a random minigame
  const getRandomMinigame = useCallback(() => {
    const randomMinigames = getRandomMinigames();
    const randomIndex = Math.floor(Math.random() * randomMinigames.length);
    return randomMinigames[randomIndex];
  }, []);

  const [currentMinigame, setCurrentMinigame] = useState<Minigame>(specificMinigame ?? getRandomMinigame());
  const [showTransition, setShowTransition] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialTime ?? MINIGAME_TIME);
  const [timerActive, setTimerActive] = useState(false);
  const [countdownValue, setCountdownValue] = useState<string>("3");
  const [pendingMinigame, setPendingMinigame] = useState<Minigame | null>(null);

  // Timer effect
  useEffect(() => {
    if (!timerActive || showTransition) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        const newTime = t - 1;
        if (newTime <= 0) {
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerActive, showTransition]);

  // Check for game over when time runs out
  useEffect(() => {
    if (timerActive && timeLeft <= 0) {
      onGameOver();
    }
  }, [timeLeft, timerActive, onGameOver]);

  // Separate effect to notify parent of time changes
  useEffect(() => {
    onTimeUpdate(timeLeft);
  }, [timeLeft, onTimeUpdate]);

  // If the parent changes the initialTime (e.g. difficulty changed), update the timer
  useEffect(() => {
    if (initialTime !== undefined && !timerActive) {
      setTimeLeft(initialTime);
      onTimeUpdate(initialTime);
    }
  }, [initialTime, timerActive, onTimeUpdate]);

  // Initial countdown effect
  useEffect(() => {
    const startCountdown = () => {
      setCountdownValue("3");
      setTimeout(() => {
        setCountdownValue("2");
        setTimeout(() => {
          setCountdownValue("1");
          setTimeout(() => {
            setCountdownValue("SKRAWL!");
            setTimeout(() => {
              setCountdownValue("");
              setTimerActive(true);
            }, 500);
          }, 1000);
        }, 1000);
      }, 1000);
    };

    // Start countdown on mount
    if (!timerActive && !showTransition) {
      startCountdown();
    }
  }, []);

  // Transition effect
  useEffect(() => {
    if (showTransition) {
      setTimerActive(false);
      const timer = setTimeout(() => {
        const nextMinigame = pendingMinigame ?? getRandomMinigame();
        setCurrentMinigame(nextMinigame);
        setPendingMinigame(null);
        setShowTransition(false);
        const nextTime = initialTime ?? MINIGAME_TIME;
        setTimeLeft(nextTime);
        onTimeUpdate(nextTime);
        setTimerActive(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showTransition, pendingMinigame, initialTime, onTimeUpdate, getRandomMinigame]);

  const handleComplete = (success: boolean, reward: number) => {
    void reward; // reward included for API parity; rewards are handled when a minigame finishes
    console.log(`Trace attempt: ${success ? "Success" : "Failed"} with threshold ${currentMinigame.threshold}`);

    if (success) {
      const nextShapeIndex = currentMinigame.currentShapeIndex + 1;

      if (nextShapeIndex >= currentMinigame.shapes.length) {
        // All shapes in current minigame completed
        // If specificMinigame is provided, generate a new instance of the same type
        const nextGame = specificMinigame
          ? (() => {
              const currentType = currentMinigame.id;
              const randomMinigames = getRandomMinigames();
              return randomMinigames.find((m) => m.id === currentType) || getRandomMinigame();
            })()
          : getRandomMinigame();
        setPendingMinigame(nextGame);
        setShowTransition(true); // Show transition screen
        onComplete(true, currentMinigame.totalReward); // Award total reward for completing all shapes
      } else {
        // Move to next shape in current minigame
        setCurrentMinigame((prev) => ({
          ...prev,
          currentShapeIndex: nextShapeIndex,
        }));
      }
    } else {
      // Failed attempt - regenerate a new minigame of the same type
      const newMinigame = getRandomMinigame();
      // Keep trying to get the same type of minigame
      const currentType = currentMinigame.id;
      const randomMinigames = getRandomMinigames();
      const sameTypeMinigame = randomMinigames.find((m) => m.id === currentType) || newMinigame;
      setCurrentMinigame(sameTypeMinigame);
      onComplete(false, 0); // Failed attempt
    }
  };

  if (countdownValue) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-logotype font-logotype text-skrawl-purple animate-ping">{countdownValue}</div>
      </div>
    );
  }

  if (showTransition) {
    const upcoming = pendingMinigame ?? currentMinigame;
    const transitionLabel = upcoming.transitionLabel ?? (upcoming.name.toLowerCase().includes("connect") ? "Connect!" : "Trace!");
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-logotype font-logotype text-skrawl-purple">{transitionLabel}</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <TraceCanvas
        shapes={currentMinigame.shapes}
        currentShapeIndex={currentMinigame.currentShapeIndex}
        threshold={currentMinigame.threshold}
        currentTime={timeLeft}
        onComplete={handleComplete}
        guides={currentMinigame.guides}
      />
    </div>
  );
};

export default Minigames;
