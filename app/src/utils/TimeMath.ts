// Core time math with edge case handling
export class TimeMath {
    static formatTime(seconds: number): string {
        if (!Number.isFinite(seconds) || seconds < 0) return "00:00";

        const totalSeconds = Math.floor(seconds);
        const minutes = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;

        return `${minutes.toString().padStart(2, "0")}:${secs
            .toString()
            .padStart(2, "0")}`;
    }

    static formatTimeHMS(seconds: number): string {
        if (!Number.isFinite(seconds) || seconds < 0) return "00:00:00";
        const totalSeconds = Math.floor(seconds);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }

    static clampTime(time: number, min: number, max: number): number {
        if (!Number.isFinite(time)) return min;
        return Math.max(min, Math.min(max, time));
    }

    static calculateProgress(currentTime: number, duration: number): number {
        if (
            !Number.isFinite(currentTime) ||
            !Number.isFinite(duration) ||
            duration <= 0
        ) {
            return 0;
        }
        return (currentTime / duration) * 100;
    }

    static calculateTimeFromProgress(
        progressPercent: number,
        duration: number
    ): number {
        if (
            !Number.isFinite(progressPercent) ||
            !Number.isFinite(duration) ||
            duration <= 0
        ) {
            return 0;
        }
        return this.clampTime((progressPercent / 100) * duration, 0, duration);
    }

    static parseTimestamp(minutes: number, seconds: number): number {
        if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return 0;

        // Normalize seconds to 0-59
        const normalizedMinutes = Math.floor(Math.max(0, minutes));
        const normalizedSeconds = Math.floor(Math.max(0, Math.min(59, seconds)));

        return normalizedMinutes * 60 + normalizedSeconds;
    }
}
