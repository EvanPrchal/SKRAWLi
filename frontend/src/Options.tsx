import { useAuth0 } from "@auth0/auth0-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Loading from "./Components/Loading";
import NavigationHeader from "./Components/NavigationHeader";
// Theme selection removed; handled in Shop.

const Options = () => {
  const { isLoading } = useAuth0();
  const navigate = useNavigate();
  // Theme selection moved to Shop; no theme context needed here.

  const readFromStorage = <T,>(key: string, fallback: T, mapper: (value: string) => T): T => {
    if (typeof window === "undefined") return fallback;
    const stored = localStorage.getItem(key);
    return stored !== null ? mapper(stored) : fallback;
  };

  const [difficultyLevel, setDifficultyLevel] = useState(() => readFromStorage("difficultyLevel", "normal", (v) => v));
  const [sfxVolume, setSfxVolume] = useState(() =>
    readFromStorage("sfxVolume", 50, (v) => {
      const parsed = Number(v);
      return Number.isNaN(parsed) ? 50 : parsed;
    })
  );
  const [musicVolume, setMusicVolume] = useState(() =>
    readFromStorage("musicVolume", 50, (v) => {
      const parsed = Number(v);
      return Number.isNaN(parsed) ? 50 : parsed;
    })
  );
  const [showTimer, setShowTimer] = useState(() => readFromStorage("showTimer", true, (v) => v === "true"));

  const handleSaveSettings = () => {
    localStorage.setItem("showTimer", showTimer.toString());
    localStorage.setItem("difficultyLevel", difficultyLevel);
    localStorage.setItem("sfxVolume", sfxVolume.toString());
    localStorage.setItem("musicVolume", musicVolume.toString());
    // Broadcast settings update so other components can react
    window.dispatchEvent(new CustomEvent("settingsUpdated", { detail: { difficultyLevel, showTimer } }));
    console.log("Settings saved:", {
      difficultyLevel,
      sfxVolume,
      musicVolume,
      showTimer,
    });
    // Redirect to home page
    navigate("/");
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col h-screen bg-skrawl-black bg-[url('/src/assets/images/background.png')] bg-cover">
      <NavigationHeader />
      <div className="flex flex-col items-center justify-center p-8">
        <h1 className="text-logotype font-logotype text-skrawl-white mb-8">Options</h1>

        <div className="bg-skrawl-white rounded-lg p-8 w-full max-w-2xl">
          <div className="space-y-6">
            {/* Theme selection removed: now equip themes directly in the Shop page. */}

            {/* Difficulty Level */}
            <div className="flex flex-col gap-2">
              <label className="text-body font-body text-skrawl-purple">Difficulty Level</label>
              <select
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(e.target.value)}
                className="p-2 border rounded-md border-skrawl-purple focus:outline-none focus:ring-2 focus:ring-skrawl-magenta"
              >
                <option value="easy">Easy</option>
                <option value="normal">Normal</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Volume Sliders */}
            <div className="space-y-4">
              {/* SFX Volume */}
              <div className="flex flex-col gap-2">
                <label className="text-body font-body text-skrawl-purple">SFX Volume: {sfxVolume}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sfxVolume}
                  onChange={(e) => setSfxVolume(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-skrawl-cyan"
                />
              </div>

              {/* Music Volume */}
              <div className="flex flex-col gap-2">
                <label className="text-body font-body text-skrawl-purple">Music Volume: {musicVolume}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-skrawl-cyan"
                />
              </div>
            </div>

            {/* Toggle Options */}
            <div className="space-y-4">
              {/* Timer Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-body font-body text-skrawl-purple">Show Timer</label>
                <button
                  onClick={() => setShowTimer(!showTimer)}
                  className={`w-12 h-6 rounded-full transition-colors duration-200 ease-in-out ${showTimer ? "bg-skrawl-cyan" : "bg-gray-300"}`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transform transition-transform duration-200 ease-in-out ${
                      showTimer ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveSettings}
              className="w-full mt-6 py-2 px-4 bg-skrawl-purple text-white rounded-md hover:bg-skrawl-magenta transition-colors duration-200 font-body"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Options;
