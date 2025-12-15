/**
 * TempoEngine - Utility class for tempo calculations and playback rate management
 *
 * Handles conversion between percentage display values and actual playback rates,
 * BPM adjustment calculations, and tempo clamping.
 */
export class TempoEngine {
  /** Minimum tempo as playback rate (25% = 0.25x speed) */
  static readonly MIN_TEMPO = 0.25;

  /** Maximum tempo as playback rate (400% = 4x speed) */
  static readonly MAX_TEMPO = 4.0;

  /** Default tempo as playback rate (100% = 1x speed) */
  static readonly DEFAULT_TEMPO = 1.0;

  /** Minimum tempo as display percentage */
  static readonly MIN_PERCENT = 25;

  /** Maximum tempo as display percentage */
  static readonly MAX_PERCENT = 400;

  /**
   * Convert slider percentage (25-400) to playback rate (0.25-4.0)
   * @param percent - Percentage value from slider (25-400)
   * @returns Playback rate (0.25-4.0)
   */
  static percentToRate(percent: number): number {
    if (!Number.isFinite(percent)) return this.DEFAULT_TEMPO;
    return this.clampTempo(percent / 100);
  }

  /**
   * Convert playback rate to display percentage
   * @param rate - Playback rate (0.25-4.0)
   * @returns Percentage for display (25-400)
   */
  static rateToPercent(rate: number): number {
    if (!Number.isFinite(rate)) return 100;
    return Math.round(this.clampTempo(rate) * 100);
  }

  /**
   * Calculate adjusted BPM based on tempo rate
   * @param originalBPM - Original detected BPM
   * @param tempoRate - Current tempo rate (0.25-4.0)
   * @returns Adjusted BPM at current tempo, or null if originalBPM is null
   */
  static adjustBPM(
    originalBPM: number | null,
    tempoRate: number
  ): number | null {
    if (originalBPM === null || !Number.isFinite(originalBPM)) return null;
    if (!Number.isFinite(tempoRate)) return originalBPM;
    return Math.round(originalBPM * tempoRate);
  }

  /**
   * Clamp tempo rate to valid bounds
   * @param rate - Playback rate to clamp
   * @returns Clamped rate between MIN_TEMPO and MAX_TEMPO
   */
  static clampTempo(rate: number): number {
    if (!Number.isFinite(rate)) return this.DEFAULT_TEMPO;
    return Math.max(this.MIN_TEMPO, Math.min(this.MAX_TEMPO, rate));
  }

  /**
   * Get preset tempo values for quick selection buttons
   * @returns Array of preset percentages
   */
  static getPresets(): number[] {
    return [25, 50, 75, 100, 125, 150, 200, 300, 400];
  }

  /**
   * Format tempo rate as a display string
   * @param rate - Playback rate (0.25-4.0)
   * @returns Formatted string like "100%" or "150%"
   */
  static formatTempo(rate: number): string {
    return `${this.rateToPercent(rate)}%`;
  }
}
