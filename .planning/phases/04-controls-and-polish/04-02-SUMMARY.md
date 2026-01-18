---
phase: 04-controls-and-polish
plan: 02
subsystem: ui
tags: [zustand, persist, progress-bar, localStorage, position-tracking]

# Dependency graph
requires:
  - phase: 02-core-rsvp-engine
    provides: "Reading store with Zustand, settings store with persistence"
  - phase: 03-pdf-integration
    provides: "Document store with section management, TOC navigation"
  - phase: 04-01
    provides: "Keyboard shortcuts and restart functionality"
provides:
  - "Position persistence with composite key matching (filename + section range)"
  - "Visual progress bar with time estimation"
  - "Auto-save during playback every 5 seconds"
  - "Position restore on section load"
  - "Settings persistence verification"
affects: [deployment, testing]

# Tech tracking
tech-stack:
  added: ["zustand persist middleware in reading-store"]
  patterns: ["Composite key position matching", "Periodic auto-save with setInterval", "Dynamic require to prevent circular dependency"]

key-files:
  created: []
  modified:
    - "store/reading-store.ts"
    - "components/reader/RSVPControls.tsx"
    - "app/page.tsx"

key-decisions:
  - "Composite key matching (filename + section range) prevents wrong position restore"
  - "partialize limits persistence to savedPosition only (not runtime state)"
  - "Dynamic require prevents circular dependency with document-store"
  - "5-second auto-save interval balances performance and data safety"
  - "Progress bar with time estimate uses WPM for remaining time calculation"

patterns-established:
  - "Pattern 1: Composite key persistence - Position saved with document context (filename + section) for accurate restoration"
  - "Pattern 2: Periodic auto-save - setInterval with proper cleanup in useEffect return"
  - "Pattern 3: Boundary validation - Check savedIndex < groupedWords.length before restore"

# Metrics
duration: 3min
completed: 2026-01-18
---

# Phase 4 Plan 2: Position Persistence & Progress Tracking Summary

**Visual progress bar with time estimate, reading position persistence across browser sessions with composite key matching, and auto-save every 5 seconds during playback**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-18T19:18:24Z
- **Completed:** 2026-01-18T19:21:30Z
- **Tasks:** 4
- **Files modified:** 3

## Accomplishments
- Position persistence with composite key matching (filename + section range + wordIndex)
- Visual progress bar component with smooth animation from 0% to 100%
- Time estimate calculation showing remaining reading time based on WPM
- Auto-save on pause/back navigation and periodic auto-save every 5 seconds during playback
- Position restore on section load with boundary validation
- Settings persistence verification (UI-03) confirmed from Phase 2 implementation

## Task Commits

Each task was committed atomically:

1. **Task 1: Add position persistence to reading store** - `00940a1` (feat)
2. **Task 2: Add visual progress bar with time estimate** - `6a64d08` (feat)
3. **Task 3: Add position auto-save and restore** - `7e450fb` (feat)
4. **Task 4: Verify settings persistence (UI-03)** - `b4ca700` (test)

## Files Created/Modified
- `store/reading-store.ts` - Added persist middleware with SavedPosition interface, savePosition/restorePosition actions
- `components/reader/RSVPControls.tsx` - Added Progress bar component with time estimate (M:SS format)
- `app/page.tsx` - Added position save on pause, restore on section load, periodic auto-save during playback

## Decisions Made

**1. Composite key matching for position restore**
- Rationale: Prevents restoring position from wrong document or section
- Implementation: Match filename + sectionStart + sectionEnd before returning wordIndex
- Benefit: Users never resume at wrong position in different content

**2. partialize limits persistence to savedPosition only**
- Rationale: Runtime state (currentWord, isPlaying) should not persist across sessions
- Implementation: `partialize: (state) => ({ savedPosition: state.savedPosition })`
- Benefit: Prevents stale state issues on browser refresh

**3. Dynamic require to prevent circular dependency**
- Rationale: reading-store needs document-store in restorePosition, but both use create() at module level
- Implementation: `const { useDocumentStore } = require('./document-store')` inside function
- Benefit: Avoids module initialization deadlock

**4. 5-second auto-save interval**
- Rationale: Balances data safety (frequent saves) with performance (not every word)
- Implementation: setInterval in useEffect with cleanup on unmount
- Benefit: Position preserved even on browser crash without jank

**5. Time estimate based on WPM**
- Rationale: Users need to know remaining reading time for session planning
- Implementation: `(remainingWords / wpm) * 60` seconds, formatted as M:SS or Xs
- Benefit: Accurate time estimate updates dynamically as user reads

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

**1. Font loading error on first build (transient)**
- **Issue:** Turbopack build failed with Geist font loading error from CDN
- **Resolution:** Retried build, succeeded on second attempt (network issue)
- **Impact:** None - build passes consistently after retry

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Phase 4 Complete:** All controls and polish requirements fulfilled
- ✓ Keyboard shortcuts (Space, Escape, R) - Plan 04-01
- ✓ Position persistence with composite key matching - Plan 04-02
- ✓ Visual progress bar with time estimate - Plan 04-02
- ✓ Periodic auto-save during playback - Plan 04-02
- ✓ Settings persistence (WPM, word grouping) - Verified from Phase 2

**Requirements fulfilled:**
- CTRL-01: Pause and resume from exact position ✓
- CTRL-02: Restart current section from beginning ✓ (Plan 04-01)
- CTRL-03: Keyboard shortcuts (Space, Escape, R) ✓ (Plan 04-01)
- CTRL-04: Progress bar showing position in section ✓
- CTRL-05: Reading position persists across browser sessions ✓
- CTRL-06: Progress bar displays ✓
- UI-03: Settings persist across sessions ✓ (Verified from Phase 2)

**Application ready for:**
- Production deployment
- End-to-end testing
- User acceptance testing
- Performance optimization (if needed)

**No blockers** - All v1 requirements complete.

---
*Phase: 04-controls-and-polish*
*Completed: 2026-01-18*
