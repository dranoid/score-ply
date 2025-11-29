import React from "react";
import { useStore } from "../store/useStore";

export const TrackInfo: React.FC = () => {
    const metadata = useStore((state) => state.audio.metadata);

    if (!metadata) return null;

    const { coverArtUrl, title, artist, album, genre } = metadata;

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
                <h1 className="text-4xl font-bold mb-2 truncate">
                    {title || "Unknown Track"}
                </h1>
                {artist && (
                    <p className="text-xl text-white/80 mb-1 truncate">{artist}</p>
                )}
                {album && (
                    <p className="text-base text-white/60 mb-1 truncate">{album}</p>
                )}
                {genre && (
                    <p className="text-sm text-white/50 truncate">Genre: {genre}</p>
                )}
            </div>
        </div>
    );
};
