/**
 * Settings store with localStorage persistence using Zustand.
 *
 * Settings persist across browser sessions via zustand/middleware/persist.
 * Default values:
 * - 300 WPM (comfortable reading speed)
 * - 1 word per group (beginner-friendly)
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  wpm: number;
  wordsPerGroup: number;

  setWPM: (wpm: number) => void;
  setWordsPerGroup: (count: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      wpm: 300,
      wordsPerGroup: 1,

      setWPM: (wpm) => set({ wpm }),
      setWordsPerGroup: (count) => set({ wordsPerGroup: count }),
    }),
    {
      name: 'rsvp-settings', // localStorage key
    }
  )
);
