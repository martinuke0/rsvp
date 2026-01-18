'use client';

import { useEffect, useRef } from 'react';
import { useReadingStore } from '@/store/reading-store';
import { useSettingsStore } from '@/store/settings-store';
import { RSVPEngine } from '@/lib/rsvp/engine';
import { splitAtORP } from '@/lib/rsvp/orp-calculator';
import clsx from 'clsx';

/**
 * RSVP Display Component with ORP highlighting.
 *
 * Key patterns:
 * 1. Selective Zustand subscriptions - components re-render ONLY when subscribed values change
 * 2. RSVPEngine in useRef - persists across re-renders, cleanup on unmount
 * 3. useEffect for play/pause - responds to isPlaying changes
 * 4. splitAtORP for rendering - prefix/center/suffix with ORP-based center letter
 *
 * Performance critical:
 * - Selective subscriptions prevent re-render jank at high WPM
 * - RAF-based timing in engine provides 60fps smooth display
 * - Engine lifecycle tied to component mount/unmount
 */
export function RSVPDisplay() {
  // Selective subscriptions - only re-render when these values change
  const currentWord = useReadingStore((state) => state.currentWord);
  const isPlaying = useReadingStore((state) => state.isPlaying);
  const currentIndex = useReadingStore((state) => state.currentIndex);
  const wpm = useSettingsStore((state) => state.wpm);

  // Engine persists across re-renders
  const engineRef = useRef<RSVPEngine | null>(null);

  // Initialize engine on mount, cleanup on unmount
  useEffect(() => {
    engineRef.current = new RSVPEngine();
    return () => {
      engineRef.current?.destroy();
    };
  }, []);

  // Handle play/pause state changes
  useEffect(() => {
    const words = useReadingStore.getState().words;
    const setCurrentWord = useReadingStore.getState().setCurrentWord;

    if (isPlaying && engineRef.current) {
      engineRef.current.start(
        words,
        wpm,
        currentIndex,
        (word, index) => {
          setCurrentWord(word, index);
        }
      );
    } else {
      engineRef.current?.pause();
    }

    // Cleanup when dependencies change
    return () => {
      engineRef.current?.pause();
    };
  }, [isPlaying, wpm, currentIndex]);

  // Split word at ORP for rendering
  const [before, center, after] = currentWord
    ? splitAtORP(currentWord)
    : ['', '', ''];

  return (
    <div className="flex items-center justify-center min-h-[200px] bg-background">
      <div className="text-center font-mono text-4xl">
        {currentWord ? (
          <span>
            <span className="text-foreground/70">{before}</span>
            <span
              className={clsx(
                'text-red-500 font-bold',
                'relative',
                "after:content-[''] after:absolute after:inset-0",
                'after:bg-red-500/10 after:-z-10 after:scale-150'
              )}
            >
              {center}
            </span>
            <span className="text-foreground/70">{after}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">
            Press play to start reading
          </span>
        )}
      </div>
    </div>
  );
}
