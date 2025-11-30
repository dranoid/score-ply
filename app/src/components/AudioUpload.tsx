import React, { useRef } from "react";
import { Upload } from "lucide-react";
import { useStore } from "../store/useStore";
import { MetadataExtractor } from "../utils/MetadataExtractor";

export const AudioUpload: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { addTrack, setIsLoading, setError, resetAudio } = useStore();

    const handleFileChange = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("audio/")) {
            setError("Please select a valid audio file");
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const metadata = await MetadataExtractor.extractMetadata(file);
            const url = URL.createObjectURL(file);
            addTrack({ file, url, metadata });
        } catch (error) {
            console.error("Error loading audio file:", error);
            setError("Failed to load audio file");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleReset = () => {
        resetAudio();
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const file = useStore((state) => state.audio.file);

    return (
        <div className="w-full">
            <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
            />

            {!file ? (
                <button
                    onClick={handleUploadClick}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-lg transition-colors btn btn-dashed"
                >
                    <Upload className="w-6 h-6" />
                    <span className="text-lg font-medium">Upload Audio File</span>
                </button>
            ) : (
                <div className="flex items-center justify-between px-4 py-2 bg-white/10 rounded-lg border border-white/10">
                    <span className="text-sm truncate">{file.name}</span>
                    <button
                        onClick={handleReset}
                        className="ml-4 px-3 py-1 text-sm rounded transition-colors btn btn-secondary"
                    >
                        Remove
                    </button>
                </div>
            )}
        </div>
    );
};
