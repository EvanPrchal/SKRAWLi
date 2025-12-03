import React from "react";

interface GameplayLayoutProps {
  lives: number;
  timeRemaining: number;
  userName?: string;
  children: React.ReactNode;
  notification?: string;
  avatarMood?: "neutral" | "happy" | "sad";
}

const moodToFilename: Record<"neutral" | "happy" | "sad", string> = {
  neutral: "splotch_neutral.png",
  happy: "splotch_happy.png",
  sad: "splotch_sad.png",
};

const GameplayLayout: React.FC<GameplayLayoutProps> = ({ lives, timeRemaining, userName, children, notification, avatarMood }) => {
  const currentMood = avatarMood ?? "neutral";
  const avatarSrc = `./src/assets/svgs/${moodToFilename[currentMood]}`;
  return (
    <div className="flex flex-col h-screen bg-skrawl-cyan bg-[url('/src/assets/images/background.png')] bg-cover items-center justify-center relative">
      <section className="gameplay-ui w-4/6 bg-skrawl-white mb-2 rounded-t-lg text-skrawl-purple flex justify-around font-header text-header items-center">
        <div className="lives-ui flex justify-center">
          <img src="./src/assets/svgs/lives.png" alt="Lives" className="w-1/6" />
          <h1>x{lives}</h1>
        </div>
        <img src={avatarSrc} alt={`${currentMood} splotch avatar${userName ? ` for ${userName}` : ""}`} className="w-[10%] self-center" />
        <section className="timer-ui flex justify-center">
          <span>{Math.max(timeRemaining, 0)}</span>
          <img src="./src/assets/svgs/time.png" alt="Seconds" className="w-1/6" />
        </section>
      </section>
      <div className="w-4/6 h-4/6 flex flex-col bg-skrawl-white rounded-b-lg relative overflow-hidden">
        {children}
        {notification && (
          <div className="absolute inset-0 flex items-center justify-center bg-skrawl-white">
            <div className="text-logotype font-logotype text-skrawl-purple text-center">{notification}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameplayLayout;
