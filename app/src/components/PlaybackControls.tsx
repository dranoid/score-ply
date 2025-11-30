import React from "react";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { useStore } from "../store/useStore";

export const PlaybackControls: React.FC = () => {
    const { isPlaying, currentTime, duration } = useStore((state) => state.audio);

    const handlePlayPause = () => {
        window.dispatchEvent(
            new CustomEvent("audio-play-pause", { detail: { play: !isPlaying } })
        );
    };

    const handleSkipBackward = () => {
        const newTime = Math.max(0, currentTime - 10);
        window.dispatchEvent(
            new CustomEvent("audio-seek", { detail: { time: newTime } })
        );
    };

    const handleSkipForward = () => {
        const newTime = Math.min(duration, currentTime + 10);
        window.dispatchEvent(
            new CustomEvent("audio-seek", { detail: { time: newTime } })
        );
    };

    return (
        <div className="flex items-center justify-center gap-6 mb-6">
            {/* Skip Backward */}
            <button
                onClick={handleSkipBackward}
                className="btn btn-icon"
                aria-label="Skip backward 10 seconds"
            >
                <SkipBack className="w-6 h-6" />
            </button>

            {/* Play/Pause */}
            <button
                onClick={handlePlayPause}
                className="p-4 rounded-full shadow-lg hover:scale-105 transition-transform btn btn-primary"
                aria-label={isPlaying ? "Pause" : "Play"}
            >
                {isPlaying ? (
                    <Pause className="w-8 h-8" fill="currentColor" />
                ) : (
                    <Play className="w-8 h-8" fill="currentColor" />
                )}
            </button>

            {/* Skip Forward */}
            <button
                onClick={handleSkipForward}
                className="btn btn-icon"
                aria-label="Skip forward 10 seconds"
            >
                <SkipForward className="w-6 h-6" />
            </button>
        </div>
    );
};
