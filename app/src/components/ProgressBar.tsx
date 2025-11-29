import React, { useRef, useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import { TimeMath } from "../utils/TimeMath";

export const ProgressBar: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentTime, duration } = useStore((state) => state.audio);
  const [dragging, setDragging] = useState(false);

  const seekToClientX = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const time = TimeMath.calculateTimeFromProgress(percentage, duration);
    window.dispatchEvent(new CustomEvent("audio-seek", { detail: { time } }));
  };

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => seekToClientX(e.clientX);
    const handleUp = () => setDragging(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging]);

  const progress = TimeMath.calculateProgress(currentTime, duration);

  return (
    <div className="w-full mb-4">
      <div className="flex justify-between text-sm text-white/80 mb-2">
        <span>{TimeMath.formatTime(currentTime)}</span>
        <span>{TimeMath.formatTime(duration)}</span>
      </div>

      <div
        ref={containerRef}
        className="relative w-full h-4 bg-slate-300 rounded-full cursor-pointer group"
        role="slider"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={currentTime}
        tabIndex={0}
        onMouseDown={(e) => {
          setDragging(true);
          seekToClientX(e.clientX);
        }}
        onClick={(e) => seekToClientX(e.clientX)}
      >
        <div
          className="absolute top-0 left-0 h-full bg-teal-500 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-teal-700 rounded-full shadow-lg"
          style={{ left: `${progress}%`, transform: "translate(-50%, -50%)" }}
        />
      </div>
    </div>
  );
};
