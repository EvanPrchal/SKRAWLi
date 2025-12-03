import React, { useState, useRef, useEffect } from "react";
import clickSound from "../assets/sound/feddy.wav";

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

const clickVariantToFilename: Record<"derp" | "doodle", string> = {
  derp: "splotch_derp.png",
  doodle: "splotch_doodle.png",
};

const DOODLE_CHANCE = 0.08; // Roughly 8% chance to show the doodle face on click

const GameplayLayout: React.FC<GameplayLayoutProps> = ({ lives, timeRemaining, userName, children, notification, avatarMood }) => {
  const currentMood = avatarMood ?? "neutral";
  const [clickVariant, setClickVariant] = useState<null | "derp" | "doodle">(null);
  const clickTimeoutRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const clickBufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current !== null) {
        window.clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      if (audioCtxRef.current) {
        const ctx = audioCtxRef.current;
        audioCtxRef.current = null;
        clickBufferRef.current = null;
        void ctx.close().catch(() => undefined);
      }
    };
  }, []);

  const ensureClickBuffer = async (): Promise<AudioBuffer | null> => {
    if (typeof window === "undefined") {
      return null;
    }

    const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      return null;
    }

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextCtor();
      }

      const ctx = audioCtxRef.current;
      if (!ctx) {
        return null;
      }

      if (ctx.state === "suspended") {
        void ctx.resume();
      }

      if (clickBufferRef.current) {
        return clickBufferRef.current;
      }

      const response = await fetch(clickSound);
      if (!response.ok) {
        throw new Error(`Failed to fetch avatar click sound: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      clickBufferRef.current = decoded;
      return decoded;
    } catch (error) {
      console.error("Unable to play avatar click sound", error);
      return null;
    }
  };

  const playAvatarClickSound = async () => {
    const buffer = await ensureClickBuffer();
    const ctx = audioCtxRef.current;
    if (!buffer || !ctx) {
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
    source.addEventListener("ended", () => {
      source.disconnect();
    });
  };

  const handleAvatarClick = () => {
    if (clickTimeoutRef.current !== null) {
      window.clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }

    const nextVariant = Math.random() < DOODLE_CHANCE ? "doodle" : "derp";
    setClickVariant(nextVariant);
    void playAvatarClickSound();

    clickTimeoutRef.current = window.setTimeout(() => {
      setClickVariant(null);
      clickTimeoutRef.current = null;
    }, 1000);
  };

  const activeAvatarFilename = clickVariant ? clickVariantToFilename[clickVariant] : moodToFilename[currentMood];
  const avatarSrc = `./src/assets/svgs/${activeAvatarFilename}`;
  const avatarLabel = clickVariant ?? currentMood;
  return (
    <div className="flex flex-col h-screen bg-skrawl-cyan bg-[url('/src/assets/images/background.png')] bg-cover items-center justify-center relative">
      <section className="gameplay-ui w-4/6 bg-skrawl-white mb-2 rounded-t-lg text-skrawl-purple flex justify-around font-header text-header items-center">
        <div className="lives-ui flex justify-center">
          <img src="./src/assets/svgs/lives.png" alt="Lives" className="w-1/6" />
          <h1>x{lives}</h1>
        </div>
        <img
          src={avatarSrc}
          alt={`${avatarLabel} splotch avatar${userName ? ` for ${userName}` : ""}`}
          className="w-[10%] self-center cursor-pointer"
          onClick={handleAvatarClick}
        />
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
