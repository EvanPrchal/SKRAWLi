import { useEffect, useState } from "react";

type Listener = (volume: number) => void;

const listeners = new Set<Listener>();
let currentVolume = 0.5; // Stored as 0.0-1.0 ratio

const clamp = (value: number): number => {
  if (Number.isNaN(value)) {
    return 0;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
};

const readVolumeFromStorage = (): number => {
  if (typeof window === "undefined") {
    return currentVolume;
  }
  const stored = window.localStorage.getItem("sfxVolume");
  if (!stored) {
    return currentVolume;
  }
  const parsed = Number(stored);
  if (Number.isNaN(parsed)) {
    return currentVolume;
  }
  return clamp(parsed / 100);
};

const notify = () => {
  listeners.forEach((listener) => listener(currentVolume));
};

const updateVolume = (volume: number) => {
  const clamped = clamp(volume);
  if (Math.abs(clamped - currentVolume) < 0.0001) {
    return;
  }
  currentVolume = clamped;
  notify();
};

if (typeof window !== "undefined") {
  // Initialize from storage on module load
  currentVolume = readVolumeFromStorage();

  window.addEventListener("settingsUpdated", (event) => {
    const detail = (event as CustomEvent).detail ?? {};
    if (typeof detail.sfxVolume === "number") {
      updateVolume(detail.sfxVolume / 100);
    }
  });

  window.addEventListener("storage", (event) => {
    if (event.key === "sfxVolume") {
      updateVolume(readVolumeFromStorage());
    }
  });
}

export const getSfxVolume = (): number => currentVolume;

export const subscribeToSfxVolume = (listener: Listener): (() => void) => {
  listeners.add(listener);
  listener(currentVolume);
  return () => {
    listeners.delete(listener);
  };
};

export const useSfxVolume = (): number => {
  const [volume, setVolume] = useState<number>(() => currentVolume);

  useEffect(() => {
    return subscribeToSfxVolume(setVolume);
  }, []);

  return volume;
};
