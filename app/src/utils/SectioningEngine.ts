import { TimeMath } from "./TimeMath";

export interface AudioSection {
    startTime: number;
    endTime: number;
    label: string;
}

export class SectioningEngine {
    static createSectionsByCount(
        duration: number,
        count: number
    ): AudioSection[] {
        if (
            !Number.isFinite(duration) ||
            duration <= 0 ||
            !Number.isFinite(count) ||
            count <= 0
        ) {
            return [];
        }

        const sectionCount = Math.floor(count);
        const sectionDuration = duration / sectionCount;
        const sections: AudioSection[] = [];

        for (let i = 0; i < sectionCount; i++) {
            const startTime = i * sectionDuration;
            const endTime =
                i === sectionCount - 1 ? duration : (i + 1) * sectionDuration;

            sections.push({
                startTime,
                endTime,
                label: `${TimeMath.formatTime(startTime)} - ${TimeMath.formatTime(
                    endTime
                )}`,
            });
        }

        return sections;
    }

    static createSectionsByDuration(
        duration: number,
        sectionDuration: number
    ): AudioSection[] {
        if (
            !Number.isFinite(duration) ||
            duration <= 0 ||
            !Number.isFinite(sectionDuration) ||
            sectionDuration <= 0
        ) {
            return [];
        }

        const count = Math.ceil(duration / sectionDuration);
        const sections: AudioSection[] = [];

        for (let i = 0; i < count; i++) {
            const startTime = i * sectionDuration;
            const endTime = Math.min((i + 1) * sectionDuration, duration);

            sections.push({
                startTime,
                endTime,
                label: `${TimeMath.formatTime(startTime)} - ${TimeMath.formatTime(
                    endTime
                )}`,
            });
        }

        return sections;
    }
}
