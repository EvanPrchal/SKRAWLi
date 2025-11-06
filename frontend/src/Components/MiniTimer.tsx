import React from "react";

interface MiniTimerProps {
  time: number;
  show: boolean;
}

const MiniTimer: React.FC<MiniTimerProps> = ({ time, show }) => {
  if (!show) return null;

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
      <div className="bg-skrawl-black/80 text-skrawl-white px-4 py-2 rounded-full font-logotype text-xl">{time}s</div>
    </div>
  );
};

export default MiniTimer;
