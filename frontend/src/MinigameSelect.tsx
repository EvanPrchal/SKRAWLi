import { useState } from "react";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import Loading from "./Components/Loading";
import Minigames from "./Components/Minigames";
import { getRandomMinigames } from "./Components/minigamesData";
import type { Minigame } from "./Components/types";

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

const readDevMode = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }
  return localStorage.getItem("devMode") === "true";
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
  const { user, isLoading } = useAuth0();
  const [selectedMinigame, setSelectedMinigame] = useState<Minigame | null>(null);
  const [coins, setCoins] = useState<number>(0);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [lives, setLives] = useState<number>(3);
  const [configuredMinigameTime, setConfiguredMinigameTime] = useState<number>(() => timeForDifficulty(readDifficultyLevel()));
  const [timeRemaining, setTimeRemaining] = useState<number>(() => timeForDifficulty(readDifficultyLevel()));
  const [devMode] = useState<boolean>(() => readDevMode());

  const minigameOptions = getMinigameOptions();

  const handleComplete = (success: boolean, reward: number) => {
    if (success) {
      setCoins((c) => c + reward);
    } else {
      if (!devMode) {
        setLives((l) => {
          const nextLives = l - 1;
          if (nextLives <= 0) {
            setGameOver(true);
            return 0;
          }
          return nextLives;
        });
      }
    }
  };

  const handleMinigameSelect = (minigame: Minigame) => {
    const latestTime = timeForDifficulty(readDifficultyLevel());
    setConfiguredMinigameTime(latestTime);
    setTimeRemaining(latestTime);
    setSelectedMinigame(minigame);
    setGameOver(false);
    setCoins(0);
    setLives(3);
  };

  const handleBackToSelect = () => {
    setSelectedMinigame(null);
    setGameOver(false);
    setCoins(0);
    setLives(3);
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col h-screen bg-skrawl-black bg-cover items-center">
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
        {!selectedMinigame ? (
          <div className="flex flex-col h-full justify-around items-center p-8">
            <h2 className="text-header font-header text-skrawl-purple">Select a Minigame</h2>
            <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
              {minigameOptions.map((minigame) => (
                <button
                  key={minigame.id}
                  onClick={() => handleMinigameSelect(minigame)}
                  className="bg-skrawl-purple text-skrawl-white p-6 rounded-lg hover:bg-skrawl-magenta transition-colors font-body text-body"
                >
                  <h3 className="font-header text-lg mb-2">{minigame.name}</h3>
                  <p className="text-sm">Reward: {minigame.totalReward} coins</p>
                </button>
              ))}
            </div>
            <button onClick={() => window.history.back()} className="text-body font-body text-skrawl-purple hover:text-skrawl-magenta">
              Back to Home
            </button>
          </div>
        ) : !gameOver ? (
          <div className="w-full h-full relative">
            <Minigames
              onComplete={handleComplete}
              onGameOver={() => {
                if (!devMode) {
                  setGameOver(true);
                }
              }}
              onTimeUpdate={setTimeRemaining}
              initialTime={configuredMinigameTime}
              devMode={devMode}
              specificMinigame={selectedMinigame}
            />
          </div>
        ) : (
          <div className="game-over h-full flex flex-col items-center justify-center text-body font-body text-skrawl-purple">
            <h2 className="text-logotype font-logotype">Game Over!</h2>
            <p>Coins earned: {coins}</p>
            <button onClick={handleBackToSelect} className="text-skrawl-purple hover:text-skrawl-magenta pt-2">
              Back to Selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default withAuthenticationRequired(MinigameSelect, {
  onRedirecting: () => <Loading />,
});
