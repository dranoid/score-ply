export class LoopEngine {
    static shouldLoop(
        currentTime: number,
        loopEnd: number
    ): boolean {
        if (!Number.isFinite(currentTime) || !Number.isFinite(loopEnd))
            return false;

        // Use a small epsilon to handle floating point precision
        const EPSILON = 0.01;
        return currentTime >= loopEnd - EPSILON;
    }

    static getLoopStartTime(loopStart: number): number {
        if (!Number.isFinite(loopStart)) return 0;
        return Math.max(0, loopStart);
    }

    static validateLoopBounds(
        startTime: number,
        endTime: number,
        duration: number
    ): { valid: boolean; error?: string } {
        if (
            !Number.isFinite(startTime) ||
            !Number.isFinite(endTime) ||
            !Number.isFinite(duration)
        ) {
            return { valid: false, error: "Invalid time values" };
        }

        if (startTime < 0 || endTime < 0) {
            return { valid: false, error: "Time values cannot be negative" };
        }

        if (startTime >= duration) {
            return { valid: false, error: "Start time must be before track end" };
        }

        if (endTime > duration) {
            return { valid: false, error: "End time cannot exceed track duration" };
        }

        if (startTime >= endTime) {
            return { valid: false, error: "Start time must be before end time" };
        }

        return { valid: true };
    }
}
