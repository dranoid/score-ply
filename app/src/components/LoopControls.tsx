import React, { useState } from "react";
import { useStore } from "../store/useStore";
import { LoopEngine } from "../utils/LoopEngine";
import { TimeMath } from "../utils/TimeMath";

export const LoopControls: React.FC = () => {
  const duration = useStore((s) => s.audio.duration);
  const currentTime = useStore((s) => s.audio.currentTime);
  const isActive = useStore((s) => s.loop.isActive);
  const startTime = useStore((s) => s.loop.startTime);
  const endTime = useStore((s) => s.loop.endTime);
  const setLoopActive = useStore((s) => s.setLoopActive);
  const setLoopBounds = useStore((s) => s.setLoopBounds);

  const [startInput, setStartInput] = useState(TimeMath.formatTime(startTime));
  const [endInput, setEndInput] = useState(TimeMath.formatTime(endTime));
  const [error, setError] = useState<string | null>(null);

  const parseInput = (val: string): number => {
    const [m = "0", s = "0"] = val.split(":");
    const mi = parseInt(m, 10);
    const si = parseInt(s, 10);
    return TimeMath.parseTimestamp(mi, si);
  };

  const applyBounds = (start: number, end: number): void => {
    const result = LoopEngine.validateLoopBounds(start, end, duration);
    if (result.valid) {
      setError(null);
      setLoopBounds(start, end);
      setLoopActive(true);
      setStartInput(TimeMath.formatTime(start));
      setEndInput(TimeMath.formatTime(end));
    } else {
      setError(result.error || "Invalid loop range");
    }
  };

  const handleToggle = (checked: boolean) => {
    if (!checked) {
      setLoopActive(false);
      setError(null);
      return;
    }
    let start = parseInput(startInput);
    let end = parseInput(endInput);
    const validation = LoopEngine.validateLoopBounds(start, end, duration);
    if (!validation.valid) {
      const half = 5; // default 10s window centered around current time
      start = Math.max(0, currentTime - half);
      end = Math.min(duration, currentTime + half);
    }
    applyBounds(start, end);
  };

  const handleStartBlur = () => {
    const start = parseInput(startInput);
    const end = parseInput(endInput);
    applyBounds(start, end);
  };

  const handleEndBlur = () => {
    const start = parseInput(startInput);
    const end = parseInput(endInput);
    applyBounds(start, end);
  };

  const quickLoop = (seconds: number) => {
    const half = seconds / 2;
    const start = Math.max(0, currentTime - half);
    const end = Math.min(duration, currentTime + half);
    applyBounds(start, end);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => handleToggle(e.target.checked)}
            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <span className="text-sm font-medium text-gray-700">Enable Loop</span>
        </label>
        {error && (
          <span className="text-xs text-red-600">{error}</span>
        )}
      </div>

      {isActive && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Start Time (mm:ss)
              </label>
              <input
                type="text"
                value={startInput}
                onChange={(e) => setStartInput(e.target.value)}
                onBlur={handleStartBlur}
                placeholder="00:00"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                End Time (mm:ss)
              </label>
              <input
                type="text"
                value={endInput}
                onChange={(e) => setEndInput(e.target.value)}
                onBlur={handleEndBlur}
                placeholder="00:00"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => quickLoop(10)}
              className="px-3 py-1 text-xs bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-md transition-colors"
            >
              10s Loop
            </button>
            <button
              onClick={() => quickLoop(30)}
              className="px-3 py-1 text-xs bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-md transition-colors"
            >
              30s Loop
            </button>
            <button
              onClick={() => quickLoop(60)}
              className="px-3 py-1 text-xs bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-md transition-colors"
            >
              1m Loop
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
