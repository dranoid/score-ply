import * as jsmediatags from "jsmediatags";
import ColorThief from "color-thief-browser";
import type { AudioMetadata } from "../types";

export class MetadataExtractor {
    private static colorThief = new ColorThief();

    static async extractMetadata(file: File): Promise<AudioMetadata> {
        try {
            const tags = await this.readTags(file);
            const metadata: AudioMetadata = {
                title: tags?.title || file.name.replace(/\.[^/.]+$/, ""),
                artist: tags?.artist,
                album: tags?.album,
                genre: tags?.genre,
            };

            // Extract cover art if available
            if (tags?.picture) {
                const coverArtUrl = this.createImageUrl(tags.picture);
                metadata.coverArtUrl = coverArtUrl;

                // Extract colors from cover art
                const colors = await this.extractColors(coverArtUrl);
                metadata.primaryColor = colors.primary;
                metadata.secondaryColor = colors.secondary;
            }

            return metadata;
        } catch (error) {
            console.error("Error extracting metadata:", error);
            return {
                title: file.name.replace(/\.[^/.]+$/, ""),
            };
        }
    }

    private static readTags(file: File): Promise<any> {
        return new Promise((resolve, reject) => {
            jsmediatags.read(file, {
                onSuccess: (tag) => resolve(tag.tags),
                onError: (error) => reject(error),
            });
        });
    }

    private static createImageUrl(picture: any): string {
        const { data, format } = picture;
        const byteArray = new Uint8Array(data);
        const blob = new Blob([byteArray], { type: format });
        return URL.createObjectURL(blob);
    }

    private static async extractColors(
        imageUrl: string
    ): Promise<{ primary: string; secondary: string }> {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";

            img.onload = () => {
                try {
                    const palette = this.colorThief.getPalette(img, 5);
                    const primary = this.rgbToHex(palette[0]);
                    const secondary = this.rgbToHex(palette[1] || palette[0]);

                    resolve({ primary, secondary });
                } catch (error) {
                    console.error("Error extracting colors:", error);
                    resolve({ primary: "#1db954", secondary: "#121212" });
                }
            };

            img.onerror = () => {
                resolve({ primary: "#1db954", secondary: "#121212" });
            };

            img.src = imageUrl;
        });
    }

    private static rgbToHex(rgb: number[]): string {
        const [r, g, b] = rgb;
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    static contrastYiq(hexColor: string): string {
        const color = parseInt(hexColor.replace("#", ""), 16);
        const r = (color >>> 16) & 0xff;
        const g = (color >>> 8) & 0xff;
        const b = color & 0xff;
        const yiq = (r * 299 + g * 587 + b * 114) / 1000;
        return yiq >= 128 ? "#000000" : "#ffffff";
    }
}
