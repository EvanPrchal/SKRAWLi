import React, { useState, useEffect, useCallback, useRef } from "react";
import threeCountdownImg from "../assets/images/3_countdown.png";
import twoCountdownImg from "../assets/images/2_countdown.png";
import oneCountdownImg from "../assets/images/1_countdown.png";
import goCountdownImg from "../assets/images/go_countdown.png";
import type { Minigame } from "./types";
import { getRandomMinigames } from "./minigamesData";
import TraceCanvas from "./TraceCanvas";

interface MinigamesProps {
  onComplete: (success: boolean, reward: number) => void;
  onGameOver: () => void;
  onTimeUpdate: (time: number) => void;
  initialTime?: number;
  specificMinigame?: Minigame; // Optional: start with a specific minigame
  skipCountdown?: boolean; // Skip the initial countdown if true
  freezeTimer?: boolean; // Pause active timer while true
}

const MINIGAME_TIME = 10; // default seconds per minigame

const countdownImageMap: Record<string, string> = {
  "3": threeCountdownImg,
  "2": twoCountdownImg,
  "1": oneCountdownImg,
  "SKRAWL!": goCountdownImg,
};

const Minigames: React.FC<MinigamesProps> = ({
  onComplete,
  onGameOver,
  onTimeUpdate,
  initialTime,
  specificMinigame,
  skipCountdown = false,
  freezeTimer = false,
}) => {
  // Function to get a random minigame
  const getRandomMinigame = useCallback(() => {
    const randomMinigames = getRandomMinigames();
    const randomIndex = Math.floor(Math.random() * randomMinigames.length);
    return randomMinigames[randomIndex];
  }, []);

  const [currentMinigame, setCurrentMinigame] = useState<Minigame>(specificMinigame ?? getRandomMinigame());
  const [showTransition, setShowTransition] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialTime ?? MINIGAME_TIME);
  const [timerActive, setTimerActive] = useState(skipCountdown);
  const [countdownValue, setCountdownValue] = useState<string>(skipCountdown ? "" : "3");
  const [pendingMinigame, setPendingMinigame] = useState<Minigame | null>(null);
  const [hasShownCountdown, setHasShownCountdown] = useState(skipCountdown);
  const [resetToken, setResetToken] = useState<number>(0);
  const frameRef = useRef<number | null>(null);
  const timerActiveRef = useRef<boolean>(timerActive);
  const showTransitionRef = useRef<boolean>(showTransition);

  useEffect(() => {
    timerActiveRef.current = timerActive;
  }, [timerActive]);

  useEffect(() => {
    showTransitionRef.current = showTransition;
  }, [showTransition]);

  // Ensure external skip flag permanently suppresses the countdown (e.g. after notifications)
  useEffect(() => {
    if (skipCountdown && !hasShownCountdown) {
      setHasShownCountdown(true);
      setCountdownValue("");
      if (!timerActive) {
        setTimerActive(true);
      }
    }
  }, [skipCountdown, hasShownCountdown, timerActive]);

  // Pause/resume timer based on freeze flag from parent
  useEffect(() => {
    if (freezeTimer) {
      if (timerActive) {
        setTimerActive(false);
      }
    } else if (!showTransition && !countdownValue && !timerActive) {
      setTimerActive(true);
    }
  }, [freezeTimer, showTransition, countdownValue, timerActive]);

  // Timer effect with high precision updates
  useEffect(() => {
    if (!timerActive || showTransition) {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      return;
    }

    let lastTime = performance.now();

    const tick = (now: number) => {
      const deltaSeconds = (now - lastTime) / 1000;
      lastTime = now;

      let shouldContinue = true;
      setTimeLeft((prev) => {
        if (!timerActiveRef.current || prev <= 0) {
          shouldContinue = false;
          return 0;
        }
        const next = prev - deltaSeconds;
        if (next <= 0) {
          shouldContinue = false;
          return 0;
        }
        return next;
      });

      if (shouldContinue && timerActiveRef.current && !showTransitionRef.current) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        if (frameRef.current !== null) {
          cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
        }
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
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

  // Initial countdown effect (runs only once unless explicitly reset)
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
              setHasShownCountdown(true);
            }, 1000);
          }, 1000);
        }, 1000);
      }, 1000);
    };

    // Start countdown on mount only if not already shown and not skipped
    if (!hasShownCountdown && !timerActive && !showTransition) {
      startCountdown();
    }
  }, [hasShownCountdown, timerActive, showTransition]);

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
        setHasShownCountdown(true);
      }, 1000);
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
      // Failed attempt - immediately swap to next minigame (no transition overlay)
      const currentType = currentMinigame.id;
      const randomMinigames = getRandomMinigames();
      const nextGame = randomMinigames.find((m) => m.id === currentType) || getRandomMinigame();
      setResetToken((token) => token + 1);
      setCurrentMinigame(nextGame);
      setPendingMinigame(null);
      const nextTime = initialTime ?? MINIGAME_TIME;
      setTimeLeft(nextTime);
      onTimeUpdate(nextTime);
      setTimerActive(true);
      setHasShownCountdown(true);
      onComplete(false, 0); // Failed attempt
    }
  };

  if (countdownValue) {
    const countdownImageSrc = countdownImageMap[countdownValue];
    return (
      <div className="w-full h-full flex items-center justify-center">
        {countdownImageSrc ? (
          <img
            key={countdownValue}
            src={countdownImageSrc}
            alt={countdownValue === "SKRAWL!" ? "Go" : `Countdown ${countdownValue}`}
            className="max-w-xs w-1/3 animate-ping [animation-duration:15s] "
          />
        ) : (
          <div key={countdownValue} className="text-logotype font-logotype animate-ping text-skrawl-purple">
            {countdownValue}
          </div>
        )}
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
        resetToken={resetToken}
      />
    </div>
  );
};

export default Minigames;
