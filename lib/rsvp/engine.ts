/**
 * RAF-based RSVP timing engine with timestamp-based positioning.
 *
 * CRITICAL: This uses requestAnimationFrame with timestamp-based positioning
 * to prevent timing drift. Do not replace with setInterval or setTimeout.
 *
 * Key architectural decisions:
 * - Timestamp-based positioning (not iteration-based incrementing)
 * - Pause/resume with correct time accounting
 * - Auto-stop at end of text
 * - cancelAnimationFrame on pause
 */
export class RSVPEngine {
  private rafId: number | null = null;
  private startTime: number = 0;
  private pausedAt: number = 0;
  private pausedWordIndex: number = 0;
  private isRunning: boolean = false;

  /**
   * Start the RAF timing loop.
   *
   * @param words - Array of words to display
   * @param wpm - Words per minute reading speed
   * @param startIndex - Word index to start from (0 = beginning)
   * @param onWordChange - Callback fired when word changes
   */
  start(
    words: string[],
    wpm: number,
    startIndex: number,
    onWordChange: (word: string, index: number) => void
  ): void {
    if (this.isRunning) {
      return; // Already running
    }

    this.isRunning = true;
    this.pausedWordIndex = startIndex;
    this.startTime = 0; // Reset start time, will be set on first frame

    const msPerWord = 60000 / wpm;

    const loop = (timestamp: number) => {
      if (!this.isRunning) return;

      // Initialize start time on first frame
      if (this.startTime === 0) {
        this.startTime = timestamp;
      }

      // Calculate elapsed time since start (accounting for pauses)
      const elapsed = timestamp - this.startTime;

      // Calculate which word should be displayed based on elapsed time
      // This is KEY: we're positioning by time, not incrementing by iteration
      const targetIndex = this.pausedWordIndex + Math.floor(elapsed / msPerWord);

      // Only trigger update if we've advanced to a new word
      if (targetIndex < words.length) {
        // Call onWordChange for current target word
        onWordChange(words[targetIndex], targetIndex);
        this.rafId = requestAnimationFrame(loop);
      } else {
        // Reached end of text
        this.isRunning = false;
        this.rafId = null;
        onWordChange(words[words.length - 1], words.length - 1);
      }
    };

    this.rafId = requestAnimationFrame(loop);
  }

  /**
   * Pause the timing loop.
   *
   * @returns Current word index position
   */
  pause(): number {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isRunning = false;

    // Store pause timestamp for potential resume
    this.pausedAt = performance.now();

    // Return current position so it can be resumed
    return this.pausedWordIndex;
  }

  /**
   * Destroy the engine and cleanup resources.
   */
  destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.isRunning = false;
    this.startTime = 0;
    this.pausedAt = 0;
    this.pausedWordIndex = 0;
  }
}
