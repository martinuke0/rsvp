---
phase: 03-pdf-integration
plan: 04
subsystem: pdf-navigation
tags: [react, zustand, shadcn-ui, pdf, navigation, toc]

# Dependency graph
requires:
  - phase: 03-03
    provides: "Document store with TOC data, section extraction utilities"
provides:
  - "TOCNavigation component with hierarchical display and click handlers"
  - "PageRangeSelector component with validation and manual page selection"
  - "Three-view architecture (upload → navigation → reading)"
  - "Back navigation preserving document state and reading position"
affects: [04-controls-polish]

# Tech tracking
tech-stack:
  added: [shadcn Input component]
  patterns: ["View state management pattern", "Section selection handlers", "Conditional UI rendering based on document state"]

key-files:
  created:
    - components/pdf/TOCNavigation.tsx
    - components/pdf/PageRangeSelector.tsx
    - components/ui/input.tsx
  modified:
    - app/page.tsx

key-decisions:
  - "Three-view state machine: upload → navigation → reading for clear separation of concerns"
  - "Back button preserves reading position within current section (pause without reset)"
  - "Full document reading remains available alongside section selection"
  - "Navigation components accept callbacks for maximum flexibility"
  - "Document store queries via getState() for one-time reads (no subscriptions needed for handlers)"

patterns-established:
  - "View state pattern: useState<'upload' | 'navigation' | 'reading'> for multi-view flows"
  - "Section selection flow: extract text → group words → initialize RSVP → update store → switch view"
  - "Conditional rendering based on document store state (show back button only for PDFs)"
  - "Handler composition: TOC selection calculates end page from next item in outline array"

# Metrics
duration: 3min
completed: 2026-01-18
---

# Phase 03 Plan 04: Navigation UI Summary

**Hierarchical TOC navigation with manual page range fallback, three-view state machine, and back navigation preserving reading position**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-18T18:53:31Z
- **Completed:** 2026-01-18T18:56:18Z
- **Tasks:** 5
- **Files modified:** 3

## Accomplishments
- Complete navigation UI with TOC hierarchy display and clickable section selection
- Manual page range selector with input validation for PDFs without structured TOC
- Three-view architecture separating upload, navigation, and reading states
- Back navigation button preserving document state and RSVP reading position
- Full document reading option alongside section-specific navigation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create TOC navigation component** - `7357438` (feat)
2. **Task 2: Create page range selector component** - `fc29159` (feat)
3. **Task 3: Verify document store wiring exists** - `a16043a` (docs)
4. **Task 4: Add navigation view UI** - `5eca6fa` (feat)
5. **Task 5: Add back navigation button** - `067920e` (feat)

## Files Created/Modified
- `components/pdf/TOCNavigation.tsx` - Hierarchical TOC display with level-based indentation, clickable items trigger section selection
- `components/pdf/PageRangeSelector.tsx` - Manual page range input with validation (start ≥ 1, end ≥ start, both ≤ pageCount)
- `components/ui/input.tsx` - shadcn Input component (installed for page range inputs)
- `app/page.tsx` - Three-view state machine, navigation handlers (TOC/range/full document), back navigation button

## Decisions Made

**Three-view state machine** - Explicit `view` state ('upload' | 'navigation' | 'reading') separates concerns and makes flow clear. PDF upload → navigation (choose section) → reading. Manual text input bypasses navigation view entirely.

**Back button preserves position** - On back navigation, pause RSVP playback but keep current word index. If user returns to same section, they resume from preserved position. If different section selected, initialize() resets position. Balances PDF-06 requirement with usability.

**Navigation handlers use getState()** - Section selection handlers read document store via `useDocumentStore.getState()` rather than hook subscriptions. One-time reads don't need re-render subscriptions, prevents unnecessary component updates.

**TOC end page calculation** - End page determined by finding next TOC item in outline array: `endPage = nextItem ? nextItem.pageIndex : doc.pageCount`. Natural boundary for section text extraction.

**Full document option preserved** - Alongside TOC and page range selection, users can still read entire document without section boundaries. All three methods coexist in navigation view.

## Deviations from Plan

None - plan executed exactly as written. Task 3 verified document store wiring already existed from Plan 03-02 (no additional implementation needed).

## Issues Encountered

None - all components integrated smoothly with existing stores and utilities. Build passed TypeScript compilation and Next.js production build without errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**PDF Integration Phase Complete** - All Phase 3 requirements fulfilled:
- ✓ PDF upload with drag-and-drop
- ✓ Web Worker text extraction without UI blocking
- ✓ TOC extraction (structured outline + font heuristics fallback)
- ✓ Navigation UI (TOC hierarchy + manual page range)
- ✓ Section selection initializes RSVP reading
- ✓ Back navigation preserves document state

**Ready for Phase 4: Controls & Polish**
- Reading position preservation foundation in place (pause functionality)
- Settings persistence already implemented (Zustand with localStorage)
- RSVP playback controls exist, ready for keyboard shortcuts
- Progress tracking can leverage reading store's progress field

**No blockers** - All Phase 3 success criteria met. End-to-end flow works: upload PDF → navigate via TOC or page range → read with RSVP → return to navigation → select different section.

---
*Phase: 03-pdf-integration*
*Completed: 2026-01-18*
