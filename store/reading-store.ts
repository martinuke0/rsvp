/**
 * Reading state store using Zustand.
 *
 * Key pattern: Selective subscriptions prevent re-render jank at high WPM.
 * Components subscribe only to specific state slices:
 *
 * @example
 * // Subscribe ONLY to currentWord (not entire store)
 * const currentWord = useReadingStore((state) => state.currentWord);
 * // This component does NOT re-render when isPlaying or progress changes!
 */
import { create } from 'zustand';

interface ReadingState {
  // Current reading state
  currentWord: string | null;
  currentIndex: number;
  totalWords: number;
  isPlaying: boolean;
  words: string[]; // Store grouped words array

  // Derived state
  progress: number; // 0-100

  // Actions
  setCurrentWord: (word: string, index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  initialize: (words: string[]) => void;
  reset: () => void;
}

export const useReadingStore = create<ReadingState>((set, get) => ({
  // Initial state
  currentWord: null,
  currentIndex: 0,
  totalWords: 0,
  isPlaying: false,
  words: [],
  progress: 0,

  // Actions
  setCurrentWord: (word, index) =>
    set((state) => ({
      currentWord: word,
      currentIndex: index,
      progress: state.totalWords > 0 ? (index / state.totalWords) * 100 : 0,
    })),

  setIsPlaying: (playing) => set({ isPlaying: playing }),

  initialize: (words) =>
    set({
      words,
      totalWords: words.length,
      currentIndex: 0,
      currentWord: words[0] || null,
      progress: 0,
      isPlaying: false,
    }),

  reset: () =>
    set({
      currentWord: null,
      currentIndex: 0,
      totalWords: 0,
      isPlaying: false,
      words: [],
      progress: 0,
    }),
}));
