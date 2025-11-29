export interface AudioMetadata {
    title?: string;
    artist?: string;
    album?: string;
    genre?: string;
    coverArtUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
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
