import React, { useRef } from "react";
import { useStore } from "../store/useStore";
import { TimeMath } from "../utils/TimeMath";

export const ProgressBar: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const audioRef = useStore((state) => state.audio);
    const { currentTime, duration } = audioRef;

    const handleSeek = (clientX: number) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        const time = TimeMath.calculateTimeFromProgress(percentage, duration);

        // We'll need to expose a seek function from the AudioPlayer
        // For now, we'll use a custom event
        window.dispatchEvent(
            new CustomEvent("audio-seek", { detail: { time } })
        );
    };

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        handleSeek(e.clientX);
    };

    const progress = TimeMath.calculateProgress(currentTime, duration);

    return (
        <div className="w-full mb-4">
            {/* Time Display */}
            <div className="flex justify-between text-sm text-white/70 mb-2">
                <span>{TimeMath.formatTime(currentTime)}</span>
                <span>{TimeMath.formatTime(duration)}</span>
            </div>

            {/* Progress Bar */}
            <div
                ref={containerRef}
                onClick={handleClick}
                className="relative w-full h-2 bg-white/20 rounded-full cursor-pointer group"
                role="slider"
                aria-valuemin={0}
                aria-valuemax={duration}
                aria-valuenow={currentTime}
                tabIndex={0}
            >
                {/* Progress Fill */}
                <div
                    className="absolute top-0 left-0 h-full bg-white rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                />

                {/* Hover Indicator */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    style={{ left: `${progress}%`, transform: "translate(-50%, -50%)" }}
                />
            </div>
        </div>
    );
};
