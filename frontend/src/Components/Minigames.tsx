import React, { useState, useEffect, useCallback } from "react";
import type { Minigame } from "./types";
import { getRandomMinigames } from "./minigamesData";
import TraceCanvas from "./TraceCanvas";

interface MinigamesProps {
  onComplete: (success: boolean, reward: number) => void;
  onGameOver: () => void;
  onTimeUpdate: (time: number) => void;
}

const MINIGAME_TIME = 10; // 10 seconds per minigame

const Minigames: React.FC<MinigamesProps> = ({ onComplete, onGameOver, onTimeUpdate }) => {
  // Function to get a random minigame
  const getRandomMinigame = () => {
    const randomMinigames = getRandomMinigames();
    const randomIndex = Math.floor(Math.random() * randomMinigames.length);
    return randomMinigames[randomIndex];
  };

  const [currentMinigame, setCurrentMinigame] = useState<Minigame>(getRandomMinigame());
  const [showTransition, setShowTransition] = useState(false);
  const [timeLeft, setTimeLeft] = useState(MINIGAME_TIME);
  const [timerActive, setTimerActive] = useState(false);
  const [countdownValue, setCountdownValue] = useState<string>("3");

  // Timer effect
  useEffect(() => {
    if (!timerActive || showTransition) return;

    if (timeLeft <= 0) {
      onGameOver();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        const newTime = t - 1;
        onTimeUpdate(newTime);
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, timerActive, showTransition, onGameOver]);

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
      // Show "Trace" for 1.5 seconds before starting the next minigame
      const timer = setTimeout(() => {
        setShowTransition(false);
        setTimeLeft(MINIGAME_TIME); // Reset timer for next minigame
        onTimeUpdate(MINIGAME_TIME);
        setTimerActive(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showTransition]);

  const handleComplete = (success: boolean, reward: number) => {
    console.log(`Trace attempt: ${success ? "Success" : "Failed"} with threshold ${currentMinigame.threshold}`);

    if (success) {
      const nextShapeIndex = currentMinigame.currentShapeIndex + 1;

      if (nextShapeIndex >= currentMinigame.shapes.length) {
        // All shapes in current minigame completed
        setShowTransition(true); // Show transition screen
        onComplete(true, currentMinigame.totalReward); // Award total reward for completing all shapes

        // Move to a random minigame after showing transition
        setTimeout(() => {
          setCurrentMinigame(getRandomMinigame());
        }, 1500);
      } else {
        // Move to next shape in current minigame
        setCurrentMinigame((prev) => ({
          ...prev,
          currentShapeIndex: nextShapeIndex,
        }));
      }
    } else {
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
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-logotype font-logotype text-skrawl-purple">Trace!</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <TraceCanvas
        shapes={currentMinigame.shapes}
        currentShapeIndex={currentMinigame.currentShapeIndex}
        threshold={currentMinigame.threshold}
        onComplete={handleComplete}
      />
    </div>
  );
};

export default Minigames;
