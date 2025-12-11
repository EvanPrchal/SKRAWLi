import React, { useState, useEffect, useCallback, useRef } from "react";
import threeCountdownImg from "../assets/images/3_countdown.png";
import twoCountdownImg from "../assets/images/2_countdown.png";
import oneCountdownImg from "../assets/images/1_countdown.png";
import goCountdownImg from "../assets/images/go_countdown.png";
import type { Minigame, Shape, Point } from "./types";
import { getRandomMinigames } from "./minigamesData";
import TraceCanvas from "./TraceCanvas";
import countdownSound from "../assets/sound/countdown.wav";
import startSound from "../assets/sound/start.wav";
import { useSfxVolume } from "../lib/sfxVolume";

interface MinigamesProps {
  onComplete: (success: boolean, reward: number) => void;
  onGameOver: () => void;
  onTimeUpdate: (time: number) => void;
  initialTime?: number;
  specificMinigame?: Minigame; // Optional: start with a specific minigame
  skipCountdown?: boolean; // Skip the initial countdown if true
  freezeTimer?: boolean; // Pause active timer while true
}

const clonePoint = (point: Point): Point => ({
  x: point.x,
  y: point.y,
});

const cloneShape = (shape: Shape): Shape => {
  if (shape.type === "polygon") {
    return { ...shape, points: shape.points.map(clonePoint) };
  }
  if (shape.type === "circle") {
    return { ...shape, center: clonePoint(shape.center) };
  }
  return { ...shape, center: clonePoint(shape.center) };
};

const cloneMinigame = (minigame: Minigame): Minigame => ({
  ...minigame,
  shapes: minigame.shapes.map(cloneShape),
  guides: minigame.guides?.map(cloneShape),
});

const instantiateMinigame = (minigame: Minigame): Minigame => ({
  ...cloneMinigame(minigame),
  currentShapeIndex: 0,
});

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
  const sfxVolume = useSfxVolume();
  // Function to get a random minigame
  const getRandomMinigame = useCallback(() => {
    const randomMinigames = getRandomMinigames();
    const randomIndex = Math.floor(Math.random() * randomMinigames.length);
    return randomMinigames[randomIndex];
  }, []);

  const getRandomMinigameById = useCallback((id: string) => {
    const randomMinigames = getRandomMinigames();
    return randomMinigames.find((game) => game.id === id);
  }, []);

  const initialMinigame = specificMinigame ? instantiateMinigame(specificMinigame) : getRandomMinigame();
  const [currentMinigame, setCurrentMinigame] = useState<Minigame>(initialMinigame);
  const [showTransition, setShowTransition] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialTime ?? MINIGAME_TIME);
  const [timerActive, setTimerActive] = useState(skipCountdown);
  const [countdownValue, setCountdownValue] = useState<string>(skipCountdown ? "" : "3");
  const [pendingMinigame, setPendingMinigame] = useState<Minigame | null>(null);
  const [hasShownCountdown, setHasShownCountdown] = useState(skipCountdown);
  const [resetToken, setResetToken] = useState<number>(0);
  const [m2SidesDrawn, setM2SidesDrawn] = useState<Set<number>>(new Set());
  const frameRef = useRef<number | null>(null);
  const timerActiveRef = useRef<boolean>(timerActive);
  const showTransitionRef = useRef<boolean>(showTransition);

  useEffect(() => {
    timerActiveRef.current = timerActive;
  }, [timerActive]);

  useEffect(() => {
    showTransitionRef.current = showTransition;
  }, [showTransition]);

  const playCountdownSound = useCallback(() => {
    if (sfxVolume <= 0) {
      return;
    }
    try {
      const audio = new Audio(countdownSound);
      audio.volume = Math.min(1, Math.max(0, sfxVolume));
      void audio.play().catch(() => undefined);
    } catch (error) {
      console.error("Failed to play countdown sound", error);
    }
  }, [sfxVolume]);

  const playStartSound = useCallback(() => {
    if (sfxVolume <= 0) {
      return;
    }
    try {
      const audio = new Audio(startSound);
      audio.volume = Math.min(1, Math.max(0, sfxVolume));
      void audio.play().catch(() => undefined);
    } catch (error) {
      console.error("Failed to play start sound", error);
    }
  }, [sfxVolume]);

  // Ensure external skip flag permanently suppresses the countdown (e.g. after notifications)
  useEffect(() => {
    if (specificMinigame) {
      setCurrentMinigame(instantiateMinigame(specificMinigame));
    }
  }, [specificMinigame]);

  useEffect(() => {
    // Reset m2 state when minigame changes
    setM2SidesDrawn(new Set());
  }, [currentMinigame.id]);

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
      playCountdownSound();
      setTimeout(() => {
        setCountdownValue("2");
        playCountdownSound();
        setTimeout(() => {
          setCountdownValue("1");
          playCountdownSound();
          setTimeout(() => {
            setCountdownValue("SKRAWL!");
            playStartSound();
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
  }, [hasShownCountdown, timerActive, showTransition, playCountdownSound, playStartSound]);

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

    // Special handling for m2 (square drawing with flexible selection)
    if (currentMinigame.id === "m2") {
      if (success) {
        // Add the current shape to the completed set
        const newSidesDrawn = new Set(m2SidesDrawn);
        newSidesDrawn.add(currentMinigame.currentShapeIndex);
        setM2SidesDrawn(newSidesDrawn);

        // If all 4 sides are drawn, evaluate the result
        if (newSidesDrawn.size >= 4) {
          // For now, consider it successful if the user completed all 4 sides
          const nextGame = specificMinigame
            ? (() => {
                const currentType = currentMinigame.id;
                const randomMinigames = getRandomMinigames();
                return randomMinigames.find((m) => m.id === currentType) || getRandomMinigame();
              })()
            : getRandomMinigame();
          setPendingMinigame(nextGame);
          setShowTransition(true);
          onComplete(true, currentMinigame.totalReward);
          setM2SidesDrawn(new Set());
          return;
        }

        // Move to next undrawn side
        let nextIndex = currentMinigame.currentShapeIndex + 1;
        while (nextIndex < currentMinigame.shapes.length && newSidesDrawn.has(nextIndex)) {
          nextIndex++;
        }
        // If all remaining sides are drawn, wrap around to find first undrawn
        if (nextIndex >= currentMinigame.shapes.length) {
          for (let i = 0; i < currentMinigame.shapes.length; i++) {
            if (!newSidesDrawn.has(i)) {
              nextIndex = i;
              break;
            }
          }
        }
        setCurrentMinigame((prev) => ({
          ...prev,
          currentShapeIndex: nextIndex,
        }));
        return;
      } else {
        // Failed a side - reset the minigame
        const nextGame = specificMinigame ? instantiateMinigame(getRandomMinigameById(specificMinigame.id) ?? specificMinigame) : getRandomMinigame();
        setResetToken((token) => token + 1);
        setCurrentMinigame(nextGame);
        setPendingMinigame(null);
        setM2SidesDrawn(new Set());
        const nextTime = initialTime ?? MINIGAME_TIME;
        setTimeLeft(nextTime);
        onTimeUpdate(nextTime);
        setTimerActive(true);
        setHasShownCountdown(true);
        onComplete(false, 0);
        return;
      }
    }

    // Regular handling for other minigames
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
      // Failed attempt - stay on the same minigame type but generate a fresh instance
      const nextGame = specificMinigame ? instantiateMinigame(getRandomMinigameById(specificMinigame.id) ?? specificMinigame) : getRandomMinigame();
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

  const guidesToShow = (() => {
    if (currentMinigame.id !== "m5" || !currentMinigame.guides) return currentMinigame.guides;
    const showEllipseGuide = currentMinigame.currentShapeIndex >= 6; // after edges (4) + diagonals (2)
    return currentMinigame.guides.filter((g) => showEllipseGuide || !g.id.toLowerCase().includes("guide-ellipse"));
  })();

  return (
    <div className="w-full h-full">
      <TraceCanvas
        shapes={currentMinigame.shapes}
        currentShapeIndex={currentMinigame.currentShapeIndex}
        threshold={currentMinigame.threshold}
        currentTime={timeLeft}
        onComplete={handleComplete}
        guides={guidesToShow}
        resetToken={resetToken}
      />
      {currentMinigame.id === "m2" && (
        <div className="absolute top-4 right-4 text-2xl font-bold text-skrawl-purple">
          Lines Left: {4 - m2SidesDrawn.size}/{4}
        </div>
      )}
      {currentMinigame.id === "m5" && (
        <div className="absolute top-4 right-4 text-2xl font-bold text-skrawl-purple">
          Lines Left: {currentMinigame.shapes.length - currentMinigame.currentShapeIndex}/{currentMinigame.shapes.length}
        </div>
      )}
    </div>
  );
};

export default Minigames;
