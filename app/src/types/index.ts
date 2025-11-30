export interface AudioMetadata {
    title?: string;
    artist?: string;
    album?: string;
    genre?: string;
    coverArtUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
}

export interface Track {
    file: File;
    url: string;
    metadata: AudioMetadata | null;
}

export interface AudioState {
    file: File | null;
    url: string | null;
    metadata: AudioMetadata | null;
    duration: number;
    currentTime: number;
    isPlaying: boolean;
    isLoading: boolean;
    error: string | null;
    volume: number;
    playlist: Track[];
    currentIndex: number;
}

export interface LoopState {
    isActive: boolean;
    startTime: number;
    endTime: number;
}

export interface SectioningState {
    sections: AudioSection[];
    activeSectionIndex: number | null;
    mode: "count" | "duration";
}

export interface AudioSection {
    startTime: number;
    endTime: number;
    label: string;
}

export type RepeatMode = "off" | "all" | "one";

export interface UIState {
    isRightSidebarOpen: boolean;
    shuffle: boolean;
    repeatMode: RepeatMode;
}
