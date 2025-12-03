import React, { useState, useRef, useEffect } from "react";
import clickSound from "../assets/sound/feddy.wav";
import { useSfxVolume } from "../lib/sfxVolume";

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
  const sfxVolume = useSfxVolume();

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

  const getAudioContext = async (): Promise<AudioContext | null> => {
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
        await ctx.resume().catch(() => undefined);
      }

      return ctx;
    } catch (error) {
      console.error("Unable to play avatar click sound", error);
      return null;
    }
  };

  const ensureClickBuffer = async (ctx: AudioContext): Promise<AudioBuffer | null> => {
    if (clickBufferRef.current) {
      return clickBufferRef.current;
    }

    try {
      const response = await fetch(clickSound);
      if (!response.ok) {
        throw new Error(`Failed to fetch avatar click sound: ${response.status}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      clickBufferRef.current = decoded;
      return decoded;
    } catch (error) {
      console.error("Unable to load avatar click sound", error);
      return null;
    }
  };

  const playAvatarClickSample = async () => {
    if (sfxVolume <= 0) {
      return;
    }
    const ctx = await getAudioContext();
    if (!ctx) {
      return;
    }

    const buffer = await ensureClickBuffer(ctx);
    if (!buffer) {
      return;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(Math.min(1, sfxVolume), ctx.currentTime);

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    source.addEventListener("ended", () => {
      source.disconnect();
      gain.disconnect();
    });
  };

  const playAvatarSynthSound = async () => {
    if (sfxVolume <= 0) {
      return;
    }
    const ctx = await getAudioContext();
    if (!ctx) {
      return;
    }

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.18);

      const startGain = 0.18 * sfxVolume;
      if (startGain <= 0) {
        osc.disconnect();
        gain.disconnect();
        return;
      }
      const endGain = Math.max(0.0001, 0.001 * sfxVolume);
      gain.gain.setValueAtTime(startGain, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(endGain, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.24);

      osc.addEventListener("ended", () => {
        osc.disconnect();
        gain.disconnect();
      });
    } catch (error) {
      console.error("Unable to play fallback avatar click sound", error);
    }
  };

  const handleAvatarClick = () => {
    if (clickTimeoutRef.current !== null) {
      window.clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }

    const nextVariant = Math.random() < DOODLE_CHANCE ? "doodle" : "derp";
    setClickVariant(nextVariant);
    if (nextVariant === "doodle") {
      void playAvatarSynthSound();
    } else {
      void playAvatarClickSample();
    }

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
