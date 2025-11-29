import React, { useRef, useEffect } from "react";
import { useStore } from "../store/useStore";
import { LoopEngine } from "../utils/LoopEngine";
import { TrackInfo } from "./TrackInfo";
import { PlaybackControls } from "./PlaybackControls";
import { ProgressBar } from "./ProgressBar";

export const AudioPlayer: React.FC = () => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const animationFrameRef = useRef<number | null>(null);

    const { url, isPlaying, duration } = useStore((state) => state.audio);
    const loop = useStore((state) => state.loop);
    const setDuration = useStore((state) => state.setDuration);
    const setCurrentTime = useStore((state) => state.setCurrentTime);
    const setIsPlaying = useStore((state) => state.setIsPlaying);
    const setError = useStore((state) => state.setError);


    // Handle metadata loading
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadedMetadata = () => {
            const newDuration = audio.duration;
            if (Number.isFinite(newDuration) && newDuration > 0) {
                setDuration(newDuration);
            }
        };

        const handleError = () => {
            setError("Failed to load audio file");
            setIsPlaying(false);
        };

        audio.addEventListener("loadedmetadata", handleLoadedMetadata);
        audio.addEventListener("error", handleError);

        return () => {
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
            audio.removeEventListener("error", handleError);
        };
    }, [setDuration, setError, setIsPlaying]);

    // Handle playback with requestAnimationFrame
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.play().catch((error) => {
                console.error("Playback error:", error);
                setIsPlaying(false);
            });

            const updateTime = () => {
                if (audio && !audio.paused) {
                    const time = audio.currentTime;
                    setCurrentTime(time);

                    // Check for loop
                    if (loop.isActive && LoopEngine.shouldLoop(time, loop.endTime)) {
                        audio.currentTime = LoopEngine.getLoopStartTime(loop.startTime);
                    }

                    animationFrameRef.current = requestAnimationFrame(updateTime);
                }
            };

            animationFrameRef.current = requestAnimationFrame(updateTime);
        } else {
            audio.pause();
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isPlaying, loop, duration, setCurrentTime, setIsPlaying]);

    // Handle custom events for seeking and play/pause
    useEffect(() => {
        const handleSeek = (e: Event) => {
            const customEvent = e as CustomEvent<{ time: number }>;
            if (audioRef.current) {
                audioRef.current.currentTime = customEvent.detail.time;
                setCurrentTime(customEvent.detail.time);
            }
        };

        const handlePlayPause = (e: Event) => {
            const customEvent = e as CustomEvent<{ play: boolean }>;
            setIsPlaying(customEvent.detail.play);
        };

        window.addEventListener("audio-seek", handleSeek);
        window.addEventListener("audio-play-pause", handlePlayPause);

        return () => {
            window.removeEventListener("audio-seek", handleSeek);
            window.removeEventListener("audio-play-pause", handlePlayPause);
        };
    }, [setCurrentTime, setIsPlaying]);

    // Handle ended event
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleEnded = () => {
            if (loop.isActive) {
                audio.currentTime = loop.startTime;
                audio.play();
            } else {
                setIsPlaying(false);
            }
        };

        audio.addEventListener("ended", handleEnded);

        return () => {
            audio.removeEventListener("ended", handleEnded);
        };
    }, [loop, setIsPlaying]);

    if (!url) return null;

    return (
        <div className="w-full max-w-4xl mx-auto">
            <audio ref={audioRef} src={url} preload="metadata" />

            <TrackInfo />
            <ProgressBar />
            <PlaybackControls />
        </div>
    );
};
