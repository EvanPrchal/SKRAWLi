import { useEffect, useState } from "react";

type Listener = (enabled: boolean) => void;

const listeners = new Set<Listener>();
let currentEnabled = false;

const readSettingFromStorage = (): boolean => {
  if (typeof window === "undefined") {
    return currentEnabled;
  }
  const stored = window.localStorage.getItem("showCustomCursor");
  if (stored === null) {
    return false;
  }
  return stored === "true";
};

const notify = () => {
  for (const listener of listeners) {
    listener(currentEnabled);
  }
};

const updateSetting = (enabled: boolean) => {
  if (currentEnabled === enabled) {
    return;
  }
  currentEnabled = enabled;
  notify();
};

if (typeof window !== "undefined") {
  currentEnabled = readSettingFromStorage();

  window.addEventListener("settingsUpdated", (event) => {
    const detail = (event as CustomEvent).detail ?? {};
    if (typeof detail.showCustomCursor === "boolean") {
      updateSetting(detail.showCustomCursor);
    }
  });

  window.addEventListener("storage", (event) => {
    if (event.key === "showCustomCursor") {
      updateSetting(readSettingFromStorage());
    }
  });
}

export const getCustomCursorEnabled = (): boolean => currentEnabled;

export const subscribeToCustomCursor = (listener: Listener): (() => void) => {
  listeners.add(listener);
  listener(currentEnabled);
  return () => {
    listeners.delete(listener);
  };
};

export const useCustomCursorSetting = (): boolean => {
  const [enabled, setEnabled] = useState<boolean>(() => currentEnabled);

  useEffect(() => subscribeToCustomCursor(setEnabled), []);

  return enabled;
};
