import { useState, useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Loading from "./Components/Loading";
import TraceCanvas from "./Components/TraceCanvas";
import { shapes as allShapes } from "./Components/shapes";
import type { Shape } from "./Components/types";
import { randomizeShape } from "./Components/utils";

const GAME_TIME = 60;

const Run = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const pickRandomShape = (): Shape => {
    const base = allShapes[Math.floor(Math.random() * allShapes.length)];
    return randomizeShape(base, canvasSize.width, canvasSize.height);
  };

  const [started, setStarted] = useState<boolean>(false);
  const [currentShape, setCurrentShape] = useState<Shape>(() => pickRandomShape());
  const [coins, setCoins] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(GAME_TIME);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [lives, setLives] = useState<number>(3);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!started) return;
    if (timeLeft <= 0) {
      setGameOver(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, started]);

  // New: effect to measure container size
  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;

    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      setCanvasSize({ width: rect.width, height: rect.height });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, [started, gameOver]); // re-compute when game starts or ends

  const handleComplete = (success: boolean, reward: number) => {
    if (success) {
      setCoins((c) => c + reward);
    } else {
      setLives((l) => l - 1);
      if (lives <= 1) {
        setGameOver(true);
        setTimeLeft(0);
      }
    }
    setCurrentShape(pickRandomShape());
  };

  const handleStart = () => {
    setStarted(true);
    setGameOver(false);
    setCoins(0);
    setLives(3);
    setTimeLeft(GAME_TIME);
    setCurrentShape(pickRandomShape());
  };

  const handleStartOver = () => {
    handleStart();
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    isAuthenticated && (
      <div className="flex flex-col h-screen bg-skrawl-black bg-[url('/src/assets/images/subtle-texture.png')] bg-cover items-center">
        <section className={`gameplay-ui text-skrawl-white  flex justify-around font-header text-header items-end`}>
          <div className="lives-ui flex">
            <img src="./src/assets/svgs/lives.png" alt="Lives" />
            <h1 className="text-accent-cyan">x{lives}</h1>
          </div>
          <img src="./src/assets/images/pint2.png" alt={user?.name} className="w-[10%] self-center p-5" />
          <section className="timer-ui flex">
            <span className="text-skrawl-white">{timeLeft}</span>
            <img src="./src/assets/svgs/time.png" alt="Seconds" />
          </section>
        </section>
        <div className="w-4/6 h-4/6 flex flex-col bg-skrawl-white rounded-lg relative">
          {!started ? (
            <div className="flex flex-col h-full justify-around items-center">
              <button onClick={handleStart} className="text-logotype font-logotype text-skrawl-purple hover:cursor-pointer hover:text-skrawl-magenta">
                Start Game
              </button>
            </div>
          ) : !gameOver ? (
            <div ref={canvasContainerRef} className="w-full h-full relative">
              <TraceCanvas shape={currentShape} threshold={100} onComplete={handleComplete} />
              {/* UI overlay container matching canvas size */}
              <div
                className="absolute top-0 left-0 pointer-events-none"
                style={{
                  width: `${canvasSize.width}px`,
                  height: `${canvasSize.height}px`,
                }}
              >
                {/* Here you could place overlay UI if needed */}
              </div>
            </div>
          ) : (
            <div className="game-over h-full flex flex-col items-center justify-center text-body font-body text-skrawl-purple">
              <h2 className="text-logotype font-logotype">Game Over!</h2>
              <section></section>
              <p>Coins earned: {coins}</p>
              <button onClick={handleStartOver} className="text-skrawl-purple hover:text-skrawl-magenta pt-2">
                Play Again
              </button>
            </div>
          )}
        </div>
      </div>
    )
  );
};

export default Run;
