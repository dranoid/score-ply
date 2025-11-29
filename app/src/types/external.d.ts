declare module "jsmediatags" {
    export interface Tag {
        type: string;
        tags: {
            title?: string;
            artist?: string;
            album?: string;
            genre?: string;
            picture?: {
                data: number[];
                format: string;
            };
        };
    }

    export interface ReadResult {
        tags: Tag["tags"];
    }

    export function read(
        file: File | Blob,
        callbacks: {
            onSuccess: (tag: ReadResult) => void;
            onError: (error: any) => void;
        }
    ): void;
}

declare module "jsmediatags/dist/jsmediatags.min.js" {
    const jsmediatags: {
        read(
            file: File | Blob,
            callbacks: {
                onSuccess: (tag: { tags: {
                    title?: string;
                    artist?: string;
                    album?: string;
                    genre?: string;
                    picture?: { data: number[]; format: string };
                } }) => void;
                onError: (error: any) => void;
            }
        ): void;
    };
    export default jsmediatags;
}

declare module "color-thief-browser" {
    export default class ColorThief {
        getColor(img: HTMLImageElement, quality?: number): number[];
        getPalette(
            img: HTMLImageElement,
            colorCount?: number,
            quality?: number
        ): number[][];
    }
}
