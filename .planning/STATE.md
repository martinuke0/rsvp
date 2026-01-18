# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2025-01-18)

**Core value:** Effective speed reading through precise focal point guidance - the center letter highlight combined with customizable word grouping and speed control enables readers to maintain focus and comprehension at accelerated reading speeds.

**Current focus:** Phase 3 - PDF Integration

## Current Position

Phase: 3 of 4 (PDF Integration)
Plan: 2 of 3 complete
Status: In progress
Last activity: 2026-01-18 — Completed 03-02-PLAN.md (PDF Text Extraction)

Progress: [██████░░░░] 60%

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: 4 min
- Total execution time: 0.4 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-project-foundation | 2/2 | 10 min | 5 min |
| 02-core-rsvp-engine | 2/2 | 9 min | 4.5 min |
| 03-pdf-integration | 2/3 | 6 min | 3 min |

**Recent Trend:**
- Last 5 plans: 02-01 (3m), 02-02 (6m), 03-01 (3m), 03-02 (3m)
- Trend: Excellent velocity, consistently 3 minutes per plan in Phase 3

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Client-side PDF processing for privacy + no backend costs
- Single document session model to simplify v1
- shadcn UI design system for clean, modern aesthetic
- Stone theme selected for minimalist granite aesthetic (01-01)
- Tailwind CSS v4 with @tailwindcss/postcss plugin (01-01)
- Project name "rsvp-speed-reader" in lowercase for npm compatibility (01-01)
- Geist font family for professional typography (01-01)
- Worker file in public folder to bypass bundler processing (01-02)
- postinstall script automates worker file copy ensuring version matching (01-02)
- Dynamic import with ssr:false prevents SSR issues with PDF.js (01-02)
- Early Vercel deployment validates production configuration (01-02)
- RAF with timestamp positioning prevents timing drift (02-01)
- ORP at 30-40% from word start based on eye movement research (02-01)
- Zustand selective subscriptions prevent re-render jank at high WPM (02-01)
- Default 300 WPM for comfortable reading speed, 1 word per group for beginners (02-01)
- useCallback for text loading handlers to prevent stale closure bugs (02-02)
- RSVPEngine in useRef to persist across re-renders without recreation (02-02)
- Auto-load sample text on mount for immediate user demo (02-02)
- Minimal extraction in 03-01 (page count only) - full text deferred to 03-02 for focused implementation (03-01)
- Two-worker architecture: extraction worker orchestrates PDF.js internal worker (03-01)
- Transferable objects for ArrayBuffer transfer for zero-copy performance (03-01)
- 30-second timeout for PDF extraction with automatic cleanup (03-01)
- Sequential lazy page loading with page.cleanup() prevents memory accumulation for 50MB files (03-02)
- usePDFExtraction hook orchestrates extraction → word grouping → RSVP initialization chain (03-02)
- Document store created to persist PDF metadata for Plan 03-03 TOC navigation (03-02)
- Dual input UI preserves manual text input alongside PDF upload for flexibility (03-02)

### Pending Todos

None yet.

### Blockers/Concerns

**Phase 3 (PDF Integration):**
- ✓ Web Worker architecture established in 03-01 (foundational, non-blocking)
- ✓ Lazy page loading with memory cleanup implemented in 03-02 (memory management proven effective)
- TOC extraction reliability concern - only ~30% of PDFs have proper bookmarks, fallback heuristics needed (03-03)

## Session Continuity

Last session: 2026-01-18 (plan execution)
Stopped at: Completed 03-02-PLAN.md - PDF Text Extraction with lazy page loading and RSVP integration
Resume file: None

**Phase 1 Complete:** Foundation established with Next.js 16, shadcn/ui, PDF.js worker configuration, and Vercel deployment.

**Phase 2 Complete:** Core RSVP engine with RAF timing, ORP calculator, word grouping, Zustand stores, and complete UI (display with ORP highlighting, play/pause controls, WPM/grouping sliders). Working RSVP reader with sample text and custom text input.

**Phase 3 In Progress:** Plans 03-01 and 03-02 complete. Full PDF extraction working with lazy page loading, memory cleanup, and RSVP integration. End-to-end flow functional: PDF upload → text extraction → RSVP reading. Document store populated for Plan 03-03 (TOC navigation).
