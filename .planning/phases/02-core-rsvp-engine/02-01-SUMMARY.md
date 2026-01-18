---
phase: 02-core-rsvp-engine
plan: 01
subsystem: rsvp-engine
tags: [zustand, requestAnimationFrame, RAF, ORP, state-management, typescript]

# Dependency graph
requires:
  - phase: 01-project-foundation
    provides: Next.js 16 setup with TypeScript and build configuration
provides:
  - RAF-based timing engine with timestamp positioning (no drift)
  - ORP calculator with 30-40% positioning based on eye movement research
  - Fixed-size word grouping utility
  - Zustand stores with selective subscriptions (reading state, settings)
  - localStorage persistence for settings
affects: [02-02-ui-components, 03-pdf-integration]

# Tech tracking
tech-stack:
  added: [zustand@5.0.10, use-debounce@10.1.0]
  patterns:
    - RAF timing loop with timestamp-based positioning
    - ORP calculation with length-based weighting (30-40% from word start)
    - Zustand selective subscriptions for high-frequency updates
    - localStorage persistence via zustand/middleware

key-files:
  created:
    - lib/rsvp/engine.ts
    - lib/rsvp/orp-calculator.ts
    - lib/rsvp/word-grouper.ts
    - store/reading-store.ts
    - store/settings-store.ts
  modified:
    - package.json

key-decisions:
  - "RAF with timestamp positioning prevents timing drift (cannot be retrofitted)"
  - "ORP at 30-40% from word start based on eye movement research (trains user fixation correctly)"
  - "Zustand selective subscriptions prevent re-render jank at high WPM (Context would cause full subtree re-renders)"
  - "Default 300 WPM for comfortable reading speed, 1 word per group for beginners"

patterns-established:
  - "RAF timing loop: Calculate target index from elapsed time, not iteration count"
  - "ORP calculation: Length-based weighting (≤2 chars: 50%, 3-5: 35%, 6-9: 33%, >9: 30%)"
  - "Selective subscriptions: Components subscribe to specific state slices only"
  - "Settings persistence: zustand persist middleware with localStorage key 'rsvp-settings'"

# Metrics
duration: 3min
completed: 2026-01-18
---

# Phase 2 Plan 1: Core RSVP Engine Summary

**RAF-based timing engine with timestamp positioning, ORP calculator using 30-40% eye movement research, and Zustand stores with selective subscriptions**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-18T09:46:56Z
- **Completed:** 2026-01-18T09:49:32Z
- **Tasks:** 5
- **Files modified:** 6

## Accomplishments
- RSVPEngine class with requestAnimationFrame timing loop using timestamp-based positioning (eliminates drift)
- ORP calculator with research-based 30-40% positioning (not 50% geometric center)
- Fixed-size word grouping utility for multi-word display
- Zustand reading store with selective subscriptions (prevents re-render jank at high WPM)
- Zustand settings store with localStorage persistence for WPM and word grouping preferences

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies** - `f02c18e` (chore)
2. **Task 2: Create RAF-based timing engine** - `b113733` (feat)
3. **Task 3: Create ORP calculator** - `516ed6d` (feat)
4. **Task 4: Create word grouper** - `7ad1917` (feat)
5. **Task 5: Create Zustand stores** - `87c0628` (feat)

## Files Created/Modified
- `package.json` - Added zustand@5.0.10 and use-debounce@10.1.0
- `lib/rsvp/engine.ts` - RSVPEngine class with RAF timing loop and timestamp-based positioning
- `lib/rsvp/orp-calculator.ts` - calculateORP and splitAtORP functions with 30-40% positioning
- `lib/rsvp/word-grouper.ts` - groupWords function for fixed-size word chunking
- `store/reading-store.ts` - Reading state with selective subscriptions (currentWord, index, progress, isPlaying)
- `store/settings-store.ts` - Settings state with localStorage persistence (wpm, wordsPerGroup)

## Decisions Made
None - followed plan as specified. All architectural decisions (RAF timing, ORP ratios, Zustand) were predetermined in RESEARCH.md based on eye movement research and performance requirements.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness

**Ready for React component integration (Plan 02-02):**
- Engine modules are pure TypeScript (no React dependencies) - can be imported by components
- Zustand stores ready for consumption via selective subscriptions
- ORP calculation ready for center letter highlighting in display component
- Word grouper ready for preprocessing text before display
- RAF timing engine ready for play/pause control via hooks

**Verification passed:**
- ✓ npm build completes without errors
- ✓ TypeScript compilation passes (tsc --noEmit)
- ✓ RAF timing uses `Math.floor(elapsed / msPerWord)` pattern
- ✓ ORP calculator uses 30-40% ratios (0.30, 0.33, 0.35, 0.5)
- ✓ Zustand stores use `create()` pattern with selective subscriptions
- ✓ Settings store wrapped with `persist` middleware

**No blockers or concerns.**

---
*Phase: 02-core-rsvp-engine*
*Completed: 2026-01-18*
