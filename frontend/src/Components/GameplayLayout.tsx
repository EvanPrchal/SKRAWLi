import React from "react";

interface GameplayLayoutProps {
  lives: number;
  timeRemaining: number;
  userImage?: string;
  userName?: string;
  children: React.ReactNode;
  notification?: string;
}

const GameplayLayout: React.FC<GameplayLayoutProps> = ({ lives, timeRemaining, userName, children, notification }) => {
  return (
    <div className="flex flex-col h-screen bg-skrawl-cyan bg-[url('/src/assets/images/background.png')] bg-cover items-center justify-center relative">
      <section className="gameplay-ui w-4/6 bg-skrawl-white mb-2 rounded-t-lg text-skrawl-purple flex justify-around font-header text-header items-center">
        <div className="lives-ui flex">
          <img src="./src/assets/svgs/lives.svg" alt="Lives" />
          <h1>x{lives}</h1>
        </div>
        <img src={"./src/assets/images/pint2.png"} alt={userName} className="w-[10%] self-center" />
        <section className="timer-ui flex">
          <span>{Math.max(timeRemaining, 0)}</span>
          <img src="./src/assets/svgs/time.png" alt="Seconds" />
        </section>
      </section>
      <div className="w-4/6 h-4/6 flex flex-col bg-skrawl-white rounded-b-lg">
        {notification ? (
          <div className="w-full h-full flex items-center justify-center bg-skrawl-white">
            <div className="text-logotype font-logotype text-skrawl-purple text-center">{notification}</div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default GameplayLayout;
