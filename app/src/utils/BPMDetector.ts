import { guess } from "web-audio-beat-detector";

/**
 * BPMDetector - Utility class for detecting tempo (BPM) from audio files
 *
 * Uses the web-audio-beat-detector library for BPM analysis.
 * Works best with electronic music but provides reasonable results for most genres.
 */
export class BPMDetector {
  /**
   * Detect BPM from an audio file
   * @param file - Audio file to analyze
   * @returns Detected BPM rounded to nearest integer, or null if detection fails
   */
  static async detectFromFile(file: File): Promise<number | null> {
    try {
      // Create an offline audio context for analysis
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const result = await this.detectFromBuffer(audioBuffer);

      // Clean up the audio context
      await audioContext.close();

      return result;
    } catch (error) {
      console.warn("BPM detection failed for file:", error);
      return null;
    }
  }

  /**
   * Detect BPM from an AudioBuffer
   * @param buffer - AudioBuffer to analyze
   * @returns Detected BPM rounded to nearest integer, or null if detection fails
   */
  static async detectFromBuffer(buffer: AudioBuffer): Promise<number | null> {
    try {
      // The guess function returns { bpm, offset } where bpm is the estimated tempo
      // and offset is the time of the first beat in seconds
      const result = await guess(buffer);

      if (
        result &&
        typeof result.bpm === "number" &&
        Number.isFinite(result.bpm)
      ) {
        // Round to nearest integer for display
        return Math.round(result.bpm);
      }

      return null;
    } catch (error) {
      console.warn("BPM detection failed for buffer:", error);
      return null;
    }
  }

  /**
   * Format BPM for display
   * @param bpm - BPM value or null
   * @returns Formatted string like "120 BPM" or "--" if null
   */
  static formatBPM(bpm: number | null): string {
    if (bpm === null || !Number.isFinite(bpm)) {
      return "--";
    }
    return `${Math.round(bpm)}`;
  }

  /**
   * Format BPM with adjustment for display
   * @param originalBPM - Original detected BPM
   * @param adjustedBPM - BPM adjusted for current tempo
   * @returns Formatted string like "120 → 180" or "--" if values are null
   */
  static formatBPMWithAdjustment(
    originalBPM: number | null,
    adjustedBPM: number | null
  ): string {
    const original = this.formatBPM(originalBPM);
    const adjusted = this.formatBPM(adjustedBPM);

    if (original === "--") {
      return "--";
    }

    if (original === adjusted) {
      return original;
    }

    return `${original} → ${adjusted}`;
  }
}
