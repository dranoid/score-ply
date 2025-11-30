import { create } from "zustand";
import type { AudioState, LoopState, SectioningState, Track, RepeatMode, UIState } from "../types";
import type { AudioSection } from "../utils/SectioningEngine";

interface AppState {
    audio: AudioState;
    loop: LoopState;
    sectioning: SectioningState;

    // Audio actions
    setFile: (file: File | null) => void;
    setMetadata: (metadata: AudioState["metadata"]) => void;
    setDuration: (duration: number) => void;
    setCurrentTime: (time: number) => void;
    setIsPlaying: (isPlaying: boolean) => void;
    setIsLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
    resetAudio: () => void;
    addTrack: (track: Track) => void;
    setCurrentIndex: (index: number) => void;
    setVolume: (volume: number) => void;

    // Loop actions
    setLoopActive: (isActive: boolean) => void;
    setLoopBounds: (startTime: number, endTime: number) => void;
    resetLoop: () => void;

    // Sectioning actions
    setSections: (sections: AudioSection[]) => void;
    setActiveSectionIndex: (index: number | null) => void;
    setSectioningMode: (mode: "count" | "duration") => void;
    resetSectioning: () => void;

    // UI State
    ui: UIState;
    toggleRightSidebar: () => void;
    setRightSidebarOpen: (isOpen: boolean) => void;
    cycleRepeatMode: () => void;
    setRepeatMode: (mode: RepeatMode) => void;
    toggleShuffle: () => void;
}

const initialAudioState: AudioState = {
    file: null,
    url: null,
    metadata: null,
    duration: 0,
    currentTime: 0,
    isPlaying: false,
    isLoading: false,
    error: null,
    volume: 1,
    playlist: [],
    currentIndex: 0,
};

const initialLoopState: LoopState = {
    isActive: false,
    startTime: 0,
    endTime: 0,
};

const initialSectioningState: SectioningState = {
    sections: [],
    activeSectionIndex: null,
    mode: "count",
};

export const useStore = create<AppState>((set) => ({
    audio: initialAudioState,
    loop: initialLoopState,
    sectioning: initialSectioningState,

    // Audio actions
    setFile: (file) =>
        set((state) => ({
            audio: {
                ...state.audio,
                file,
                url: file ? URL.createObjectURL(file) : null,
            },
        })),

    setMetadata: (metadata) =>
        set((state) => ({
            audio: { ...state.audio, metadata },
        })),

    setDuration: (duration) =>
        set((state) => ({
            audio: { ...state.audio, duration },
        })),

    setCurrentTime: (time) =>
        set((state) => ({
            audio: { ...state.audio, currentTime: time },
        })),

    setIsPlaying: (isPlaying) =>
        set((state) => ({
            audio: { ...state.audio, isPlaying },
        })),

    setIsLoading: (isLoading) =>
        set((state) => ({
            audio: { ...state.audio, isLoading },
        })),

    setError: (error) =>
        set((state) => ({
            audio: { ...state.audio, error },
        })),

    setVolume: (volume: number) =>
        set((state) => ({
            audio: { ...state.audio, volume },
        })),

    resetAudio: () =>
        set(() => ({
            audio: initialAudioState,
        })),

    addTrack: (track) =>
        set((state) => {
            const playlist = [...state.audio.playlist, track];
            const currentIndex = playlist.length - 1;
            return {
                audio: {
                    ...state.audio,
                    playlist,
                    currentIndex,
                    file: track.file,
                    url: track.url,
                    metadata: track.metadata,
                    currentTime: 0,
                },
            };
        }),
    setCurrentIndex: (index) =>
        set((state) => {
            const clamped = Math.max(0, Math.min(index, state.audio.playlist.length - 1));
            const track = state.audio.playlist[clamped];
            if (!track) return state;
            return {
                audio: {
                    ...state.audio,
                    currentIndex: clamped,
                    file: track.file,
                    url: track.url,
                    metadata: track.metadata,
                    currentTime: 0,
                    isPlaying: false,
                },
            };
        }),

    // Loop actions
    setLoopActive: (isActive) =>
        set((state) => ({
            loop: { ...state.loop, isActive },
        })),

    setLoopBounds: (startTime, endTime) =>
        set((state) => ({
            loop: { ...state.loop, startTime, endTime },
        })),

    resetLoop: () =>
        set(() => ({
            loop: initialLoopState,
        })),

    // Sectioning actions
    setSections: (sections) =>
        set((state) => ({
            sectioning: { ...state.sectioning, sections },
        })),

    setActiveSectionIndex: (index) =>
        set((state) => ({
            sectioning: { ...state.sectioning, activeSectionIndex: index },
        })),

    setSectioningMode: (mode) =>
        set((state) => ({
            sectioning: { ...state.sectioning, mode },
        })),

    resetSectioning: () =>
        set(() => ({
            sectioning: initialSectioningState,
        })),

    // UI State
    ui: {
        isRightSidebarOpen: true,
        shuffle: false,
        repeatMode: "off",
    },
    toggleRightSidebar: () =>
        set((state) => ({
            ui: { ...state.ui, isRightSidebarOpen: !state.ui.isRightSidebarOpen },
        })),
    setRightSidebarOpen: (isOpen) =>
        set((state) => ({
            ui: { ...state.ui, isRightSidebarOpen: isOpen },
        })),
    cycleRepeatMode: () =>
        set((state) => ({
            ui: {
                ...state.ui,
                repeatMode:
                    state.ui.repeatMode === "off"
                        ? "all"
                        : state.ui.repeatMode === "all"
                        ? "one"
                        : "off",
            },
        })),
    setRepeatMode: (mode: RepeatMode) =>
        set((state) => ({ ui: { ...state.ui, repeatMode: mode } })),
    toggleShuffle: () =>
        set((state) => ({ ui: { ...state.ui, shuffle: !state.ui.shuffle } })),
}));
