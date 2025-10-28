// CountdownTimer.tsx
import React, { useEffect } from "react";
import { useCountdown } from "usehooks-ts"; // see docs: https://usehooks-ts.com/react-hook/use-countdown :contentReference[oaicite:0]{index=0}

interface CountdownTimerProps {
  /** Number of seconds to count down from */
  initialSeconds: number;
  /** Called when countdown reaches zero */
  onComplete?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ initialSeconds, onComplete }) => {
  const [count, { startCountdown, stopCountdown, resetCountdown }] = useCountdown({
    countStart: initialSeconds,
    countStop: 0,
    intervalMs: 1000,
    isIncrement: false,
  });

  // Start the countdown when component mounts or initialSeconds changes
  useEffect(() => {
    startCountdown();
    return () => {
      stopCountdown();
    };
  }, [initialSeconds, startCountdown, stopCountdown]);

  // Trigger onComplete when count reaches 0
  useEffect(() => {
    if (count <= 0) {
      if (onComplete) {
        onComplete();
      }
      stopCountdown();
    }
  }, [count, onComplete, stopCountdown]);

  return (
    <div>
      <span>{count}</span>
    </div>
  );
};
