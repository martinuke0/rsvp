# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2025-01-18)

**Core value:** Effective speed reading through precise focal point guidance - the center letter highlight combined with customizable word grouping and speed control enables readers to maintain focus and comprehension at accelerated reading speeds.

**Current focus:** Phase 2 - Core RSVP Engine

## Current Position

Phase: 2 of 4 (Core RSVP Engine)
Plan: 1 of 2 complete
Status: In progress
Last activity: 2026-01-18 — Completed 02-01-PLAN.md (Core Engine: RAF Timing, ORP Calculator, Zustand Stores)

Progress: [███░░░░░░░] 30%

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: 4 min
- Total execution time: 0.22 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-project-foundation | 2/2 | 10 min | 5 min |
| 02-core-rsvp-engine | 1/2 | 3 min | 3 min |

**Recent Trend:**
- Last 5 plans: 01-01 (6m), 01-02 (4m), 02-01 (3m)
- Trend: Improving velocity

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

### Pending Todos

None yet.

### Blockers/Concerns

**Phase 3 (PDF Integration):**
- Web Worker architecture for PDF processing must be foundational - cannot be retrofitted without major refactor
- 50MB file support requires lazy page loading and memory management from start
- TOC extraction reliability concern - only ~30% of PDFs have proper bookmarks, fallback heuristics needed

## Session Continuity

Last session: 2026-01-18 (plan execution)
Stopped at: Completed 02-01-PLAN.md - Core RSVP engine with RAF timing, ORP calculator, and Zustand stores
Resume file: None

**Phase 1 Complete:** Foundation established with Next.js 16, shadcn/ui, PDF.js worker configuration, and Vercel deployment.

**Phase 2 Progress (1/2):** Core engine modules complete - RAF timing loop with timestamp positioning, ORP calculator with 30-40% research-based positioning, word grouping utility, and Zustand stores with selective subscriptions. Ready for React component integration (Plan 02-02).
