let sharedAudioContext: AudioContext | null = null;

const getAudioContext = async (): Promise<AudioContext | null> => {
  if (typeof window === "undefined") {
    return null;
  }

  const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) {
    return null;
  }

  try {
    if (!sharedAudioContext) {
      sharedAudioContext = new AudioContextCtor();
    }

    if (sharedAudioContext.state === "suspended") {
      await sharedAudioContext.resume().catch(() => undefined);
    }

    return sharedAudioContext;
  } catch (error) {
    console.error("Unable to initialize doodle sound audio context", error);
    return null;
  }
};

export const playDoodleSound = async (volume: number) => {
  if (volume <= 0) {
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

    const startGain = 0.18 * volume;
    if (startGain <= 0) {
      osc.disconnect();
      gain.disconnect();
      return;
    }
    const endGain = Math.max(0.0001, 0.001 * volume);
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
    console.error("Failed to play doodle sound", error);
  }
};
