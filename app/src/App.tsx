import { ThemeProvider } from "./contexts/ThemeContext";
import { AudioUpload } from "./components/AudioUpload";
import { AudioPlayer } from "./components/AudioPlayer";
import { useStore } from "./store/useStore";
import { LoopControls } from "./components/LoopControls";

function App() {
  const { file, error, isLoading } = useStore((state) => state.audio);

  return (
    <ThemeProvider>
      <div
        className="min-h-screen text-white transition-colors duration-700"
        style={{
          background:
            "linear-gradient(to bottom, var(--primary-theme-color), var(--secondary-theme-color))",
        }}
      >
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <header className="text-center mb-12">
              <h1 className="text-5xl font-bold mb-2">Timestamp Player</h1>
              <p className="text-white/70 text-lg">
                Precise audio playback with timestamp control
              </p>
            </header>

            {/* Upload Section */}
            <div className="mb-8">
              <AudioUpload />
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-white"></div>
                <p className="mt-4 text-white/70">Loading audio...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-3 mb-8">
                <p className="text-red-200">{error}</p>
              </div>
            )}

            {/* Audio Player */}
            {file && !isLoading && <AudioPlayer />}

            {/* Placeholder for future components */}
            {file && !isLoading && (
              <div className="mt-12 space-y-6">
                <LoopControls />
              </div>
            )}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
