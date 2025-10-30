import { useState, useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Loading from "./Components/Loading";
import TraceCanvas from "./Components/TraceCanvas";
import { shapes as allShapes } from "./Components/shapes";
import type { Shape } from "./Components/types";

const GAME_TIME = 60; // seconds

function shuffleArray<T>(array: T[]): T[] {
  const arr = array.slice(); // copy
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const Run = () => {
  const [shuffledShapes, setShuffledShapes] = useState<Shape[]>(() => shuffleArray(allShapes));
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(GAME_TIME);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [lives, setLives] = useState<number>(3);

  const { user, isAuthenticated, isLoading } = useAuth0();

  const currentShape: Shape = shuffledShapes[currentIndex];

  useEffect(() => {
    if (timeLeft <= 0) {
      setGameOver(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleComplete = (success: boolean, reward: number) => {
    if (success) {
      setCoins((c) => c + reward);
    } else if (lives > 1) {
      setLives(lives - 1);
    } else {
      setGameOver(true);
      setLives(0);
    }

    // advance to next shape
    const nextIdx = currentIndex + 1;
    if (nextIdx >= shuffledShapes.length) {
      // we've used all shapes, reshuffle and start from 0
      const newOrder = shuffleArray(allShapes);
      setShuffledShapes(newOrder);
      setCurrentIndex(0);
    } else {
      setCurrentIndex(nextIdx);
    }
  };

  const handleStartOver = () => {
    setCoins(0);
    setTimeLeft(GAME_TIME);
    setGameOver(false);
    setLives(3);

    const newOrder = shuffleArray(allShapes);
    setShuffledShapes(newOrder);
    setCurrentIndex(0);
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

          {!gameOver ? (
            <div className="flex grow">
              <TraceCanvas shape={currentShape} threshold={50} onComplete={handleComplete} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-around grow text-body font-body text-skrawl-white">
              <p>Coins earned: {coins}</p>
              <h2 className="text-logotype font-logotype">Game Over!</h2>
              <button className="hover:cursor-pointer" onClick={handleStartOver}>
                Play Again
              </button>
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
