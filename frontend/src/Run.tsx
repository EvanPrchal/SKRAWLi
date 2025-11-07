import { useState, useEffect } from "react";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import Loading from "./Components/Loading";
import Minigames from "./Components/Minigames";
import Redirecting from "./Components/Redirecting";

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
  const { user, isLoading } = useAuth0();
  const [started, setStarted] = useState<boolean>(false);
  const [coins, setCoins] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [lives, setLives] = useState<number>(3);
  const [configuredMinigameTime, setConfiguredMinigameTime] = useState<number>(() => timeForDifficulty(readDifficultyLevel()));
  const [timeRemaining, setTimeRemaining] = useState<number>(() => timeForDifficulty(readDifficultyLevel()));

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

  const handleComplete = (success: boolean, reward: number) => {
    if (success) {
      setCoins((c) => c + reward);
    } else {
      setLives((l) => l - 1);
      if (lives <= 1) {
        setGameOver(true);
      }
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
  };

  const handleStartOver = () => {
    handleStart();
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col h-screen bg-skrawl-black bg-[url('/src/assets/images/subtle-texture.png')] bg-cover items-center">
      <section className={`gameplay-ui text-skrawl-white flex justify-around font-header text-header items-end`}>
        <div className="lives-ui flex">
          <img src="./src/assets/svgs/lives.png" alt="Lives" />
          <h1 className="text-accent-cyan">x{lives}</h1>
        </div>
        <img src="./src/assets/images/pint2.png" alt={user?.name} className="w-[10%] self-center p-5" />
        <section className="timer-ui flex gap-2">
          <span className="text-skrawl-white">{Math.max(timeRemaining, 0)}</span>
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
          <div className="w-full h-full relative">
            <Minigames
              onComplete={handleComplete}
              onGameOver={() => setGameOver(true)}
              onTimeUpdate={setTimeRemaining}
              initialTime={configuredMinigameTime}
            />
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
  );
};

export default withAuthenticationRequired(Run, {
  onRedirecting: () => <Redirecting />,
});
