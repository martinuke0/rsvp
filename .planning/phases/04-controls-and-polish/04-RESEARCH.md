# Phase 4: Controls & Polish - Research

**Researched:** 2026-01-18
**Domain:** UI controls, keyboard shortcuts, state persistence, progress tracking
**Confidence:** HIGH

## Summary

Phase 4 adds the final polish layer to make the RSVP reader fully keyboard-accessible and persistent across sessions. The research reveals that most infrastructure is already in place: pause/resume exists in RSVPEngine, settings already persist via Zustand middleware, and the Progress component is installed. The main work involves adding keyboard event handling, implementing restart functionality, persisting reading position, and displaying a visual progress bar.

**Key findings:**
- Manual keyboard event handling is straightforward (useEffect + window.addEventListener) - no library needed for 3-4 shortcuts
- Reading position persistence requires composite key (filename + pageCount + sectionRange) stored in localStorage
- Progress component already exists and installed (@radix-ui/react-progress v1.1.8)
- Restart is simple: reset currentIndex to 0 and reinitialize engine with existing words array
- Time estimation formula: (totalWords - currentIndex) / wpm = remaining minutes

**Primary recommendation:** Implement in 1-2 plans - keyboard shortcuts + restart in one, position persistence + progress bar in another. Both are independent and can be done in either order.

## Standard Stack

Phase 4 uses existing project dependencies - no new libraries needed.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.3 | Keyboard event handling | Built-in useEffect + window.addEventListener pattern |
| Zustand | 5.0.10 | State persistence | Already used for settings, extend for reading position |
| @radix-ui/react-progress | 1.1.8 | Progress bar UI | Already installed, shadcn component exists |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| localStorage | Browser API | Persist reading position | Small data (<5MB), synchronous access |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual keyboard handling | react-hotkeys-hook (3.4k stars) | Library adds 1 dependency for 3-4 simple shortcuts - overkill |
| localStorage | IndexedDB | IndexedDB better for >5MB data, but reading position is <1KB - unnecessary complexity |
| Zustand persist | Manual localStorage | Zustand persist provides serialization, hydration, and SSR safety - proven pattern already in use |

**Installation:**
No new packages needed - all dependencies already installed.

## Architecture Patterns

### Recommended Project Structure
```
app/
├── page.tsx                    # Add keyboard event listener here (global scope)
components/
├── reader/
│   ├── RSVPControls.tsx        # Add Progress bar and restart button
│   └── RSVPDisplay.tsx         # Already handles play/pause
store/
├── reading-store.ts            # Add persist middleware for position
└── settings-store.ts           # Already has persist (reference pattern)
lib/
└── rsvp/
    └── engine.ts               # Minor fix: update pausedWordIndex on pause
```

### Pattern 1: Global Keyboard Shortcuts with Input Field Guards
**What:** useEffect in top-level component (page.tsx) with window.addEventListener
**When to use:** Application-wide shortcuts that should work regardless of focus
**Example:**
```typescript
// Source: React documentation + standard web practices
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // CRITICAL: Ignore shortcuts when typing in input fields
    if (e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (e.key) {
      case ' ':
        e.preventDefault(); // Prevent page scroll
        // Toggle play/pause
        const isPlaying = useReadingStore.getState().isPlaying;
        useReadingStore.getState().setIsPlaying(!isPlaying);
        break;

      case 'Escape':
        e.preventDefault();
        // Navigate back (if in reading view)
        handleBackToNavigation();
        break;

      case 'r':
      case 'R':
        e.preventDefault();
        // Restart section
        handleRestart();
        break;
    }
  };

  window.addEventListener('keydown', handleKeyDown);

  // CRITICAL: Cleanup on unmount
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [/* include callback dependencies */]);
```

**Key considerations:**
- Input field guard prevents shortcuts from firing while typing
- `e.preventDefault()` stops browser defaults (space = page scroll)
- Case-insensitive handling for letter keys ('r' and 'R')
- Cleanup function prevents memory leaks
- Use `e.key` (not `e.code`) for user-facing shortcuts

### Pattern 2: Zustand Persist Middleware with Partialize
**What:** Extend Zustand store with persist middleware, selectively persist only needed fields
**When to use:** State that should survive browser refresh/close
**Example:**
```typescript
// Source: Zustand documentation + existing settings-store.ts pattern
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ReadingState {
  currentWord: string | null;
  currentIndex: number;
  totalWords: number;
  isPlaying: boolean;
  words: string[];
  progress: number;

  // Persistence metadata
  savedPosition: {
    filename: string;
    sectionStart: number;
    sectionEnd: number;
    wordIndex: number;
    timestamp: number;
  } | null;

  // Actions
  setCurrentWord: (word: string, index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  initialize: (words: string[]) => void;
  savePosition: (filename: string, section: { startPage: number; endPage: number }) => void;
  restorePosition: () => number | null;
  reset: () => void;
}

export const useReadingStore = create<ReadingState>()(
  persist(
    (set, get) => ({
      // ... existing state ...
      savedPosition: null,

      savePosition: (filename, section) => {
        const state = get();
        set({
          savedPosition: {
            filename,
            sectionStart: section.startPage,
            sectionEnd: section.endPage,
            wordIndex: state.currentIndex,
            timestamp: Date.now(),
          }
        });
      },

      restorePosition: () => {
        const state = get();
        const doc = useDocumentStore.getState();

        // Match: same filename + same section range
        if (state.savedPosition &&
            state.savedPosition.filename === doc.filename &&
            state.savedPosition.sectionStart === doc.currentSection?.startPage &&
            state.savedPosition.sectionEnd === doc.currentSection?.endPage) {
          return state.savedPosition.wordIndex;
        }

        return null; // No match, start from beginning
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
```

**Key considerations:**
- `partialize` option limits what gets persisted (not currentWord, isPlaying, etc.)
- Composite key matching: filename + sectionStart + sectionEnd ensures correct document/section
- Timestamp useful for "continue where you left off" UI
- Automatic serialization/deserialization via Zustand persist
- SSR-safe: Zustand handles hydration timing

### Pattern 3: Progress Bar with Time Estimation
**What:** Visual progress bar + text time estimate based on WPM
**When to use:** Long-form reading where user needs completion feedback
**Example:**
```typescript
// Source: Existing RSVPControls.tsx + shadcn Progress component
import { Progress } from '@/components/ui/progress';
import { useReadingStore } from '@/store/reading-store';
import { useSettingsStore } from '@/store/settings-store';

export function RSVPControls() {
  const currentIndex = useReadingStore((state) => state.currentIndex);
  const totalWords = useReadingStore((state) => state.totalWords);
  const wpm = useSettingsStore((state) => state.wpm);

  const progress = totalWords > 0
    ? Math.round((currentIndex / totalWords) * 100)
    : 0;

  // Calculate remaining time
  const remainingWords = totalWords - currentIndex;
  const remainingMinutes = remainingWords / wpm;
  const remainingSeconds = Math.ceil(remainingMinutes * 60);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Play/Pause Button */}
      {/* ... existing button ... */}

      {/* Visual Progress Bar */}
      {totalWords > 0 && (
        <div className="w-full max-w-md space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Word {currentIndex + 1} of {totalWords}</span>
            <span>{formatTime(remainingSeconds)} remaining</span>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Key considerations:**
- Progress value is 0-100 percentage
- Time calculation: (remainingWords / wpm) * 60 = seconds
- Format time as M:SS for minutes, Xs for <60 seconds
- Progress bar uses existing shadcn component (no custom styling needed)
- Selective subscriptions prevent re-render jank

### Pattern 4: Restart Section Without Reinitialization
**What:** Reset to beginning of current section without reloading words
**When to use:** User wants to restart without losing current section
**Example:**
```typescript
// In page.tsx or RSVPControls.tsx
const handleRestart = useCallback(() => {
  // Stop playback
  useReadingStore.getState().setIsPlaying(false);

  // Reset to first word of current section
  const words = useReadingStore.getState().words;
  if (words.length > 0) {
    useReadingStore.getState().setCurrentWord(words[0], 0);
  }
}, []);

// Add restart button to RSVPControls
<Button onClick={handleRestart} variant="outline">
  <RotateCcw className="mr-2 h-4 w-4" />
  Restart Section
</Button>
```

**Key considerations:**
- No need to reinitialize - words array already loaded
- Stop playback first to avoid race conditions
- Reset currentIndex to 0 via setCurrentWord
- Engine will start from index 0 on next play
- Simple implementation - no complex state management

### Anti-Patterns to Avoid

- **Adding keyboard listeners without cleanup:** Memory leak that compounds with each component mount. Always return cleanup function from useEffect.
- **Not checking input focus:** Shortcuts fire while typing in text fields, causing frustration. Always guard with target instanceof check.
- **Persisting entire store:** Wastes storage and causes hydration issues. Use `partialize` to persist only needed fields.
- **Using setInterval for progress updates:** Causes timing drift. Progress is derived state from currentIndex - no polling needed.
- **Re-reading file for hash:** Expensive operation that blocks UI. Use filename + metadata composite key instead.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Progress bar styling | Custom CSS animations | shadcn Progress component | Already installed, accessible, smooth transitions built-in |
| Time formatting | String manipulation | Standard formatting utility | Edge cases: 0 seconds, >1 hour, negative values |
| Keyboard event normalization | Cross-browser key detection | e.key standard | Modern browsers standardized, e.keyCode deprecated |
| State serialization | JSON.stringify with error handling | Zustand persist middleware | Handles SSR, hydration timing, version migrations |

**Key insight:** Phase 4 benefits from existing infrastructure. Progress component is installed, Zustand persist pattern is proven in settings-store, and React keyboard handling is straightforward. Don't over-engineer with libraries for 3-4 shortcuts.

## Common Pitfalls

### Pitfall 1: Keyboard Events Fire During Text Input
**What goes wrong:** User types 'r' in textarea to write "read", and the restart function triggers, losing their typing progress.
**Why it happens:** Global keyboard listener doesn't distinguish between typing and shortcuts.
**How to avoid:**
```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  // Guard: Ignore if typing in input/textarea
  if (e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement) {
    return;
  }
  // ... rest of shortcut handling
}
```
**Warning signs:** User reports "keyboard shortcuts trigger while typing" or "text disappears when typing certain letters"

### Pitfall 2: Space Bar Scrolls Page While Reading
**What goes wrong:** User presses Space to pause reading, but page scrolls down instead (or both pause AND scroll happen).
**Why it happens:** Space is default browser shortcut for page scroll. preventDefault() not called.
**How to avoid:**
```typescript
case ' ':
  e.preventDefault(); // CRITICAL: Prevent page scroll
  togglePlayPause();
  break;
```
**Warning signs:** Page jumps down when user pauses reading, double-behavior (pause + scroll)

### Pitfall 3: Memory Leak from Missing Cleanup
**What goes wrong:** Event listener added on every component mount but never removed. After navigating away and back 10 times, 10 listeners exist, causing shortcuts to fire 10 times.
**Why it happens:** useEffect without return cleanup function.
**How to avoid:**
```typescript
useEffect(() => {
  window.addEventListener('keydown', handleKeyDown);

  // CRITICAL: Cleanup function
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}, [deps]);
```
**Warning signs:** Shortcuts trigger multiple times, performance degrades after navigation, DevTools shows multiple listeners

### Pitfall 4: Position Restore Race Condition
**What goes wrong:** User loads document, sees "Resume from word 450?", clicks yes, but reading starts from word 0 anyway.
**Why it happens:** Position restore happens before words are initialized, or initialization overwrites restored position.
**How to avoid:**
```typescript
// Sequence matters:
// 1. Initialize words (sets currentIndex to 0)
// 2. Check for saved position
// 3. If found, update currentIndex to saved value
initialize(groupedWords);

const savedIndex = restorePosition();
if (savedIndex !== null) {
  setCurrentWord(words[savedIndex], savedIndex);
}
```
**Warning signs:** "Resume" feature doesn't work, always starts from beginning despite saved position

### Pitfall 5: Progress Bar Doesn't Update Smoothly
**What goes wrong:** Progress bar jumps in large increments or doesn't move at all until section ends.
**Why it happens:** Not subscribing to currentIndex, or only updating on pause/resume.
**How to avoid:**
- Progress is derived state: `(currentIndex / totalWords) * 100`
- Subscribe to currentIndex in component: `useReadingStore((state) => state.currentIndex)`
- Progress automatically updates because setCurrentWord triggers on every word change
- No polling or manual updates needed
**Warning signs:** Progress bar frozen, updates only on pause, jumpy animation

### Pitfall 6: Saved Position Matches Wrong Document
**What goes wrong:** User loads "Chapter 1" of Book A, system restores position from "Chapter 1" of Book B (different book, same filename).
**Why it happens:** Matching only on filename, not full document identity.
**How to avoid:**
```typescript
// Composite key matching
if (savedPosition.filename === doc.filename &&
    savedPosition.sectionStart === section.startPage &&
    savedPosition.sectionEnd === section.endPage) {
  // Safe to restore
}
```
**Warning signs:** User reports "wrong chapter loads" or "position saved from different document"

## Code Examples

Verified patterns from official sources and existing codebase:

### Keyboard Shortcut Handler (Global)
```typescript
// Source: React docs + web standards
// Location: app/page.tsx (top-level component)
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Guard: Ignore if typing in input fields
    if (e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (e.key) {
      case ' ': // Space bar
        e.preventDefault();
        const isPlaying = useReadingStore.getState().isPlaying;
        useReadingStore.getState().setIsPlaying(!isPlaying);
        break;

      case 'Escape':
        e.preventDefault();
        if (view === 'reading') {
          handleBackToNavigation();
        }
        break;

      case 'r':
      case 'R':
        e.preventDefault();
        handleRestart();
        break;
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [view]); // Include dependencies that callbacks use
```

### Reading Position Persistence (Store Extension)
```typescript
// Source: Existing settings-store.ts pattern + Zustand docs
// Location: store/reading-store.ts
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
  // ... existing fields ...
  savedPosition: SavedPosition | null;

  savePosition: (filename: string, section: { startPage: number; endPage: number }) => void;
  restorePosition: () => number | null;
}

export const useReadingStore = create<ReadingState>()(
  persist(
    (set, get) => ({
      // ... existing state ...
      savedPosition: null,

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

        // Get current document/section from document store
        const doc = useDocumentStore.getState();

        // Match: same document + same section
        if (saved.filename === doc.filename &&
            saved.sectionStart === doc.currentSection?.startPage &&
            saved.sectionEnd === doc.currentSection?.endPage) {
          return saved.wordIndex;
        }

        return null; // No match
      },
    }),
    {
      name: 'rsvp-reading-position',
      partialize: (state) => ({
        savedPosition: state.savedPosition,
      }),
    }
  )
);
```

### Progress Bar with Time Estimate
```typescript
// Source: Existing RSVPControls.tsx + shadcn Progress
// Location: components/reader/RSVPControls.tsx
import { Progress } from '@/components/ui/progress';
import { useReadingStore } from '@/store/reading-store';
import { useSettingsStore } from '@/store/settings-store';

export function RSVPControls() {
  const isPlaying = useReadingStore((state) => state.isPlaying);
  const currentIndex = useReadingStore((state) => state.currentIndex);
  const totalWords = useReadingStore((state) => state.totalWords);
  const wpm = useSettingsStore((state) => state.wpm);

  const progress = totalWords > 0
    ? Math.round((currentIndex / totalWords) * 100)
    : 0;

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
        onClick={() => setIsPlaying(!isPlaying)}
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
    </div>
  );
}
```

### Restart Section Function
```typescript
// Source: Existing reading-store pattern
// Location: app/page.tsx or components/reader/RSVPControls.tsx
import { RotateCcw } from 'lucide-react';

const handleRestart = useCallback(() => {
  const reading = useReadingStore.getState();

  // Stop playback
  reading.setIsPlaying(false);

  // Reset to first word of current section
  if (reading.words.length > 0) {
    reading.setCurrentWord(reading.words[0], 0);
  }
}, []);

// In RSVPControls.tsx, add restart button:
<Button onClick={handleRestart} variant="outline" size="sm">
  <RotateCcw className="mr-2 h-4 w-4" />
  Restart Section
</Button>
```

### Position Auto-Save on Word Change
```typescript
// Source: Existing reading flow pattern
// Location: app/page.tsx or reading-store.ts
// Auto-save position periodically during reading
useEffect(() => {
  const reading = useReadingStore.getState();
  const doc = useDocumentStore.getState();

  // Only save if actively reading a document section
  if (reading.isPlaying &&
      doc.filename &&
      doc.currentSection) {
    // Debounce saves (every 5 seconds or on pause)
    const interval = setInterval(() => {
      reading.savePosition(doc.filename!, doc.currentSection!);
    }, 5000);

    return () => clearInterval(interval);
  }
}, [/* dependencies */]);

// Also save on pause
const handlePause = () => {
  useReadingStore.getState().setIsPlaying(false);

  const doc = useDocumentStore.getState();
  if (doc.filename && doc.currentSection) {
    useReadingStore.getState().savePosition(doc.filename, doc.currentSection);
  }
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| e.keyCode | e.key | Standardized 2016 | Use e.key for user-facing shortcuts, e.code for position-based |
| setInterval/setTimeout for timing | requestAnimationFrame | RAF standardized | Already used in RSVPEngine, no changes needed |
| Custom persistence logic | Zustand persist middleware | Zustand 3.0 (2020) | Already used in settings-store, proven pattern |
| Manual localStorage serialization | Zustand automatic serialization | Zustand persist feature | Handles edge cases, SSR-safe |

**Deprecated/outdated:**
- `onKeyPress` event: Deprecated, use `onKeyDown` instead (React docs)
- `e.keyCode`: Use `e.key` for user input, `e.code` for position
- Direct localStorage.setItem with JSON.stringify: Use Zustand persist for React state

## Open Questions

Things that couldn't be fully resolved:

1. **Arrow key shortcuts for word skipping**
   - What we know: Video players use arrows for skip forward/back
   - What's unclear: What would arrows do in RSVP context? Skip 10 words? Skip sentence? Skip paragraph?
   - Recommendation: Defer to v2. Not in CTRL-04 requirements. Focus on Space/Escape/R for v1.

2. **Position persistence across word grouping changes**
   - What we know: User might change wordsPerGroup setting mid-reading
   - What's unclear: wordIndex becomes invalid if grouping changes (word 100 with grouping=1 is different from word 100 with grouping=3)
   - Recommendation: Save position when wordsPerGroup matches saved setting. If mismatch, start from beginning. Document limitation.

3. **Multiple device sync**
   - What we know: localStorage is per-browser, no cross-device sync
   - What's unclear: Would users want to resume reading on different device?
   - Recommendation: Out of scope for v1. Requires backend (conflicts with client-side-only architecture). Document as future consideration.

4. **Position save timing**
   - What we know: Could save on every word change (100s/minute at high WPM), or only on pause
   - What's unclear: Performance impact of frequent localStorage writes
   - Recommendation: Debounce to every 5 seconds + on pause. localStorage writes are fast for small data, but throttling prevents excessive I/O.

## Sources

### Primary (HIGH confidence)
- React documentation - Event Handling (https://react.dev/reference/react-dom/components/common#react-event-object) - Keyboard event API, useEffect cleanup
- Radix UI Progress API (https://www.radix-ui.com/primitives/docs/components/progress) - Component props, accessibility features
- Existing codebase patterns:
  - store/settings-store.ts - Zustand persist middleware usage
  - store/reading-store.ts - State structure, selective subscriptions
  - lib/rsvp/engine.ts - Pause/resume mechanics
  - components/ui/progress.tsx - shadcn Progress component (already installed)

### Secondary (MEDIUM confidence)
- MDN Storage API (https://developer.mozilla.org/en-US/docs/Web/API/Storage_API) - localStorage vs IndexedDB comparison
- Web standards for media controls (Space = play/pause, Escape = exit) - Industry convention

### Tertiary (LOW confidence)
- react-hotkeys-hook library existence (3.4k GitHub stars) - Not needed for this project, but confirms no standard solution exists

## Metadata

**Confidence breakdown:**
- Keyboard shortcuts: HIGH - React docs + web standards, simple implementation
- Reading position persistence: HIGH - Zustand persist proven in existing settings-store
- Progress bar: HIGH - Component already installed and working
- Restart functionality: HIGH - Straightforward state reset with existing infrastructure
- Overall implementation: HIGH - All patterns verified, no unknowns

**Research date:** 2026-01-18
**Valid until:** 30 days (stable technologies, unlikely to change)

## Implementation Recommendations

Based on research findings, Phase 4 should be implemented in **2 plans**:

### Plan 1: Keyboard Controls + Restart (CTRL-03, CTRL-04)
**Scope:**
- Add global keyboard event listener (Space, Escape, R)
- Input field guards to prevent shortcuts while typing
- Restart button and function (reset to index 0)
- Keyboard shortcut indicators in UI (optional: "Press Space to pause")

**Why together:** Both are control-focused, share keyboard handling code, no state persistence complexity

**Estimated complexity:** Low-Medium (straightforward event handling)

### Plan 2: Position Persistence + Progress Bar (CTRL-05, CTRL-06)
**Scope:**
- Extend reading-store with Zustand persist middleware
- Add savedPosition state and save/restore actions
- Implement composite key matching (filename + section)
- Add Progress component to RSVPControls
- Add time estimation display
- Auto-save position on pause + periodic saves
- Resume prompt on section load

**Why together:** Both involve state persistence and UI updates, share progress calculation logic

**Estimated complexity:** Medium (state persistence timing, position restore flow)

### Alternative: Single Plan
Could combine all features into one plan if velocity is high. Total scope is small (4 features, all with clear patterns). Splitting into 2 plans provides clearer testing boundaries.

### Dependencies
- No inter-plan dependencies - can be done in either order
- Both plans independent of Phase 5 (if planned)
- Keyboard shortcuts and position persistence don't interact

### Success Validation
**Plan 1:**
- Space toggles play/pause without page scroll
- Escape returns to navigation (when in reading view)
- R restarts section from beginning
- Shortcuts don't fire when typing in textarea

**Plan 2:**
- Progress bar displays and updates smoothly during reading
- Time estimate shows remaining time based on WPM
- Position saves on pause (check localStorage in DevTools)
- Reload page → position restored for same document/section
- Different section → position not restored (starts from beginning)
