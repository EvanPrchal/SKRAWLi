import { useAuth0 } from "@auth0/auth0-react";
import { useState } from "react";
import Loading from "./Components/Loading";

const Options = () => {
  const { isAuthenticated, isLoading } = useAuth0();

  const [difficultyLevel, setDifficultyLevel] = useState("normal");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showTimer, setShowTimer] = useState(true);
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [gameSpeed, setGameSpeed] = useState("normal");

  const handleSaveSettings = () => {
    // TODO: Implement settings save logic
    console.log("Saving settings:", {
      difficultyLevel,
      soundEnabled,
      showTimer,
      highContrastMode,
      gameSpeed,
    });
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    isAuthenticated && (
      <div className="flex flex-col h-screen bg-skrawl-black bg-[url('/src/assets/images/subtle-texture.png')] bg-cover">
        <div className="flex flex-col items-center justify-center p-8">
          <h1 className="text-logotype font-logotype text-skrawl-purple text-4xl mb-8">Options</h1>

          <div className="bg-skrawl-white rounded-lg p-8 w-full max-w-2xl">
            <div className="space-y-6">
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

              {/* Game Speed */}
              <div className="flex flex-col gap-2">
                <label className="text-body font-body text-skrawl-purple">Game Speed</label>
                <select
                  value={gameSpeed}
                  onChange={(e) => setGameSpeed(e.target.value)}
                  className="p-2 border rounded-md border-skrawl-purple focus:outline-none focus:ring-2 focus:ring-skrawl-magenta"
                >
                  <option value="slow">Slow</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                </select>
              </div>

              {/* Toggle Options */}
              <div className="space-y-4">
                {/* Sound Toggle */}
                <div className="flex items-center justify-between">
                  <label className="text-body font-body text-skrawl-purple">Sound Effects</label>
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors duration-200 ease-in-out ${soundEnabled ? "bg-skrawl-cyan" : "bg-gray-300"}`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transform transition-transform duration-200 ease-in-out ${
                        soundEnabled ? "translate-x-7" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

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

                {/* High Contrast Mode Toggle */}
                <div className="flex items-center justify-between">
                  <label className="text-body font-body text-skrawl-purple">High Contrast Mode</label>
                  <button
                    onClick={() => setHighContrastMode(!highContrastMode)}
                    className={`w-12 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                      highContrastMode ? "bg-skrawl-cyan" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transform transition-transform duration-200 ease-in-out ${
                        highContrastMode ? "translate-x-7" : "translate-x-1"
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
    )
  );
};

export default Options;
