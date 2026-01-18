'use client';

import { useReadingStore } from '@/store/reading-store';
import { useSettingsStore } from '@/store/settings-store';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw } from 'lucide-react';

/**
 * RSVP Controls Component.
 *
 * Provides play/pause controls with visual state indication and progress tracking.
 *
 * Key patterns:
 * - Selective subscriptions for performance
 * - Button disabled when no text loaded
 * - Icon toggle for clear visual state
 * - Progress indicator shows position in text
 * - Time estimate based on WPM
 */
export function RSVPControls() {
  const isPlaying = useReadingStore((state) => state.isPlaying);
  const setIsPlaying = useReadingStore((state) => state.setIsPlaying);
  const currentIndex = useReadingStore((state) => state.currentIndex);
  const totalWords = useReadingStore((state) => state.totalWords);
  const wpm = useSettingsStore((state) => state.wpm);

  const handleToggle = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    // Stop playback
    setIsPlaying(false);

    // Get words array
    const words = useReadingStore.getState().words;

    // Reset to first word
    if (words.length > 0) {
      useReadingStore.getState().setCurrentWord(words[0], 0);
    }
  };

  const progress = totalWords > 0
    ? Math.round((currentIndex / totalWords) * 100)
    : 0;

  // Calculate remaining time
  const remainingWords = totalWords - currentIndex;
  const remainingSeconds = Math.ceil((remainingWords / wpm) * 60);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Play/Pause Button */}
      <Button
        onClick={handleToggle}
        size="lg"
        className="min-w-[120px]"
        disabled={totalWords === 0}
      >
        {isPlaying ? (
          <>
            <Pause className="mr-2 h-5 w-5" />
            Pause
          </>
        ) : (
          <>
            <Play className="mr-2 h-5 w-5" />
            Play
          </>
        )}
      </Button>

      {/* Visual Progress Bar + Time */}
      {totalWords > 0 && (
        <div className="w-full max-w-md space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Word {currentIndex + 1} of {totalWords}</span>
            <span>{formatTime(remainingSeconds)} remaining</span>
          </div>
        </div>
      )}

      {/* Restart Button */}
      <Button
        onClick={handleRestart}
        variant="outline"
        size="sm"
        disabled={totalWords === 0}
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Restart Section
      </Button>

      {/* Keyboard shortcuts hint */}
      {totalWords > 0 && (
        <div className="text-xs text-muted-foreground">
          Shortcuts: Space = Play/Pause, R = Restart, Esc = Back
        </div>
      )}
    </div>
  );
}
