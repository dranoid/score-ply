import * as Tone from "tone";

/**
 * ToneAudioManager - Manages Tone.js GrainPlayer for pitch-preserved tempo control
 *
 * GrainPlayer uses granular synthesis which allows changing playback rate
 * without affecting pitch - the key to tempo-only adjustments.
 */
export class ToneAudioManager {
  private player: Tone.GrainPlayer | null = null;
  private gainNode: Tone.Gain;
  private startOffset: number = 0;
  private startTime: number = 0;
  private _duration: number = 0;
  private _isPlaying: boolean = false;
  private _playbackRate: number = 1.0;
  private animationFrameId: number | null = null;
  private onTimeUpdate: ((time: number) => void) | null = null;
  private onEnded: (() => void) | null = null;
  private onLoaded: ((duration: number) => void) | null = null;

  constructor() {
    this.gainNode = new Tone.Gain(1).toDestination();
  }

  /**
   * Load an audio file into the GrainPlayer
   */
  async loadFile(file: File): Promise<void> {
    // Stop any existing playback
    this.stop();

    // Dispose of existing player
    if (this.player) {
      this.player.dispose();
      this.player = null;
    }

    // Create object URL for the file
    const url = URL.createObjectURL(file);

    // Create new GrainPlayer
    this.player = new Tone.GrainPlayer({
      url,
      grainSize: 0.1, // 100ms grains for good quality
      overlap: 0.05, // 50ms overlap between grains
      loop: false,
      onload: () => {
        if (this.player && this.player.buffer.duration) {
          this._duration = this.player.buffer.duration;
          this.onLoaded?.(this._duration);
        }
        // Clean up object URL after loading
        URL.revokeObjectURL(url);
      },
    });

    // Connect through gain node for volume control
    this.player.connect(this.gainNode);

    // Apply current playback rate
    this.player.playbackRate = this._playbackRate;

    // Wait for buffer to load
    await Tone.loaded();
  }

  /**
   * Start or resume playback
   */
  async play(): Promise<void> {
    if (!this.player || this._isPlaying) return;

    // Ensure audio context is started (required for user gesture)
    await Tone.start();

    this._isPlaying = true;
    this.startTime = Tone.now();

    // Start from current offset
    this.player.start(undefined, this.startOffset);

    // Start time tracking
    this.startTimeTracking();
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (!this.player || !this._isPlaying) return;

    this._isPlaying = false;

    // Calculate current position before stopping
    this.startOffset = this.getCurrentTime();

    this.player.stop();
    this.stopTimeTracking();
  }

  /**
   * Stop playback and reset to beginning
   */
  stop(): void {
    if (this.player) {
      this.player.stop();
    }
    this._isPlaying = false;
    this.startOffset = 0;
    this.startTime = 0;
    this.stopTimeTracking();
  }

  /**
   * Seek to a specific time
   */
  seek(time: number): void {
    const wasPlaying = this._isPlaying;

    if (wasPlaying) {
      this.player?.stop();
    }

    this.startOffset = Math.max(0, Math.min(time, this._duration));
    this.startTime = Tone.now();

    if (wasPlaying && this.player) {
      this.player.start(undefined, this.startOffset);
    }

    this.onTimeUpdate?.(this.startOffset);
  }

  /**
   * Set playback rate (tempo) - pitch is preserved!
   * @param rate - Playback rate (0.25 to 4.0)
   */
  setPlaybackRate(rate: number): void {
    this._playbackRate = rate;
    if (this.player) {
      // Update the offset before changing rate
      if (this._isPlaying) {
        this.startOffset = this.getCurrentTime();
        this.startTime = Tone.now();
      }
      this.player.playbackRate = rate;
    }
  }

  /**
   * Set volume
   * @param volume - Volume level (0 to 1)
   */
  setVolume(volume: number): void {
    this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get current playback time
   */
  getCurrentTime(): number {
    if (!this._isPlaying) {
      return this.startOffset;
    }

    const elapsed = (Tone.now() - this.startTime) * this._playbackRate;
    const currentTime = this.startOffset + elapsed;

    // Check if we've reached the end
    if (currentTime >= this._duration) {
      return this._duration;
    }

    return currentTime;
  }

  /**
   * Get total duration
   */
  get duration(): number {
    return this._duration;
  }

  /**
   * Check if currently playing
   */
  get isPlaying(): boolean {
    return this._isPlaying;
  }

  /**
   * Get current playback rate
   */
  get playbackRate(): number {
    return this._playbackRate;
  }

  /**
   * Set callback for time updates
   */
  setOnTimeUpdate(callback: (time: number) => void): void {
    this.onTimeUpdate = callback;
  }

  /**
   * Set callback for when playback ends
   */
  setOnEnded(callback: () => void): void {
    this.onEnded = callback;
  }

  /**
   * Set callback for when audio is loaded
   */
  setOnLoaded(callback: (duration: number) => void): void {
    this.onLoaded = callback;
  }

  /**
   * Start tracking time with requestAnimationFrame
   */
  private startTimeTracking(): void {
    this.stopTimeTracking();

    const trackTime = () => {
      if (!this._isPlaying) return;

      const currentTime = this.getCurrentTime();
      this.onTimeUpdate?.(currentTime);

      // Check if playback has ended
      if (currentTime >= this._duration) {
        this._isPlaying = false;
        this.startOffset = 0;
        this.onEnded?.();
        return;
      }

      this.animationFrameId = requestAnimationFrame(trackTime);
    };

    this.animationFrameId = requestAnimationFrame(trackTime);
  }

  /**
   * Stop time tracking
   */
  private stopTimeTracking(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.stop();
    if (this.player) {
      this.player.dispose();
      this.player = null;
    }
    this.gainNode.dispose();
  }
}
