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
import { persist } from 'zustand/middleware';

interface SavedPosition {
  filename: string;
  sectionStart: number;
  sectionEnd: number;
  wordIndex: number;
  timestamp: number;
}

interface ReadingState {
  // Current reading state
  currentWord: string | null;
  currentIndex: number;
  totalWords: number;
  isPlaying: boolean;
  words: string[]; // Store grouped words array

  // Derived state
  progress: number; // 0-100

  // Position persistence
  savedPosition: SavedPosition | null;

  // Actions
  setCurrentWord: (word: string, index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  initialize: (words: string[]) => void;
  reset: () => void;
  savePosition: (filename: string, section: { startPage: number; endPage: number }) => void;
  restorePosition: () => number | null;
}

export const useReadingStore = create<ReadingState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentWord: null,
      currentIndex: 0,
      totalWords: 0,
      isPlaying: false,
      words: [],
      progress: 0,
      savedPosition: null,

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

      savePosition: (filename, section) => {
        set({
          savedPosition: {
            filename,
            sectionStart: section.startPage,
            sectionEnd: section.endPage,
            wordIndex: get().currentIndex,
            timestamp: Date.now(),
          }
        });
      },

      restorePosition: () => {
        const saved = get().savedPosition;
        if (!saved) return null;

        // Import document store to check current document
        // Dynamic import prevents circular dependency
        const { useDocumentStore } = require('./document-store');
        const doc = useDocumentStore.getState();

        // Composite key match: same filename + same section range
        if (saved.filename === doc.filename &&
            saved.sectionStart === doc.currentSection?.startPage &&
            saved.sectionEnd === doc.currentSection?.endPage) {
          return saved.wordIndex;
        }

        return null; // No match - different document or section
      },
    }),
    {
      name: 'rsvp-reading-position',
      // CRITICAL: Only persist savedPosition, not runtime state
      partialize: (state) => ({
        savedPosition: state.savedPosition,
      }),
    }
  )
);
