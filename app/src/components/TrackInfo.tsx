import React from "react";
import { useStore } from "../store/useStore";

interface TrackInfoProps {
    variant?: "small" | "large";
}

export const TrackInfo: React.FC<TrackInfoProps> = ({ variant = "large" }) => {
    const metadata = useStore((state) => state.audio.metadata);

    if (!metadata) return null;

    const { coverArtUrl, title, artist, album, genre } = metadata;

    if (variant === "small") {
        return (
            <div className="flex items-center gap-3">
                {/* Cover Art */}
                <div className="flex-shrink-0">
                    {coverArtUrl ? (
                        <img
                            src={coverArtUrl}
                            alt={title || "Album cover"}
                            className="w-14 h-14 rounded shadow-md object-cover"
                        />
                    ) : (
                        <div className="w-14 h-14 rounded bg-white/10 flex items-center justify-center">
                            <span className="text-white/50 text-xl">♪</span>
                        </div>
                    )}
                </div>

                {/* Track Metadata */}
                <div className="min-w-0 overflow-hidden">
                    <h4 className="text-sm font-medium text-white hover:underline cursor-pointer truncate">
                        {title || "Unknown Track"}
                    </h4>
                    <p className="text-xs text-white/70 hover:text-white hover:underline cursor-pointer truncate">
                        {artist || "Unknown Artist"}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-6 mb-8">
            {/* Cover Art */}
            <div className="flex-shrink-0">
                {coverArtUrl ? (
                    <img
                        src={coverArtUrl}
                        alt={title || "Album cover"}
                        style={{ width: 192, height: 192, objectFit: "cover" }}
                        className="rounded-lg shadow-2xl"
                    />
                ) : (
                    <div
                        style={{ width: 192, height: 192 }}
                        className="rounded-lg bg-white/10 flex items-center justify-center"
                    >
                        <span className="text-white/50 text-4xl">♪</span>
                    </div>
                )}
            </div>

            {/* Track Metadata */}
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider mb-2">
                    {genre || "Song"}
                </p>
                <h1 className="text-5xl font-bold mb-4 truncate leading-tight">
                    {title || "Unknown Track"}
                </h1>
                <div className="flex items-center gap-2 text-sm font-medium">
                    {artist && (
                        <>
                            <span className="hover:underline cursor-pointer">{artist}</span>
                            <span className="w-1 h-1 bg-white rounded-full" />
                        </>
                    )}
                    {album && <span className="text-white/70">{album}</span>}
                </div>
            </div>
        </div>
    );
};
