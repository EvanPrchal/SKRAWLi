import { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Loading from "./Components/Loading";
import TraceCanvas from "./Components/TraceCanvas";
import { shapes as allShapes } from "./Components/shapes";
import type { Shape } from "./Components/types";
import { randomizeShape } from "./Components/utils";

const GAME_TIME = 60;

const Run = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  const canvasWidth = 1000; // or your container width
  const canvasHeight = 500;

  const pickRandomShape = (): Shape => {
    const base = allShapes[Math.floor(Math.random() * allShapes.length)];
    return randomizeShape(base, canvasWidth, canvasHeight);
  };

  const [started, setStarted] = useState<boolean>(false);
  const [currentShape, setCurrentShape] = useState<Shape>(() => pickRandomShape());
  const [coins, setCoins] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(GAME_TIME);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [lives, setLives] = useState<number>(3);

  useEffect(() => {
    if (!started) return; // **Only run when started**
    if (timeLeft <= 0) {
      setGameOver(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, started]); // depend on started also

  const handleComplete = (success: boolean, reward: number) => {
    if (!started || gameOver) return;
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
      <div className="flex flex-col h-screen bg-skrawl-black">
        <section className="h-1/3 text-skrawl-white border-b-3 border-black flex justify-around font-header text-header items-end">
          <section className="flex">
            <img src="./src/assets/svgs/lives.png" alt="Lives" />
            <h1>x{lives}</h1>
          </section>
          <img src={user?.picture} alt={user?.name} className="w-[5%] self-center" />
          <section className="flex">
            {timeLeft}
            <img src="./src/assets/svgs/time.png" alt="Seconds" />
          </section>
        </section>

        <div className="flex grow flex-row">
          <section className="w-1/6 border-r-3"></section>

          {!started ? (
            // show start button when not started
            <div className="flex items-center justify-center">
              <button onClick={handleStart} className="text-logotype font-logotype text-skrawl-white">
                Start Game
              </button>
            </div>
          ) : !gameOver ? (
            <div className="flex grow">
              <TraceCanvas shape={currentShape} threshold={5000} onComplete={handleComplete} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-around grow text-body font-body text-skrawl-white">
              <p>Coins earned: {coins}</p>
              <h2 className="text-logotype font-logotype">Game Over!</h2>
              <button onClick={handleStartOver}>Play Again</button>
            </div>
          )}

          <section className="w-1/6 border-l-3"></section>
        </div>

        <section className="h-1/3 border-t-3"></section>
      </div>
    )
  );
};

export default Run;
