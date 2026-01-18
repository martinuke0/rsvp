# Roadmap: RSVP Speed Reader

## Overview

This roadmap transforms a blank repository into a production RSVP speed reading application. Starting with project foundation, we build the core RSVP engine with precise focal point guidance, integrate PDF processing with Web Worker architecture, and finish with reading controls and UX polish. The journey prioritizes timing precision and architectural foundations that cannot be retrofitted later.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Project Foundation** - Next.js setup, shadcn UI, deployment pipeline
- [x] **Phase 2: Core RSVP Engine** - Timing loop, focal point, word grouping, speed control
- [ ] **Phase 3: PDF Integration** - Upload, text extraction, TOC navigation, Web Worker architecture
- [ ] **Phase 4: Controls & Polish** - Reading controls, settings persistence, keyboard shortcuts, progress tracking

## Phase Details

### Phase 1: Project Foundation
**Goal**: Production-ready Next.js application deployed to Vercel with shadcn UI design system configured.

**Depends on**: Nothing (first phase)

**Requirements**: DEPLOY-01, DEPLOY-02, UI-02

**Success Criteria** (what must be TRUE):
  1. Application loads successfully in browser at localhost and Vercel URL
  2. shadcn components render with minimalist granite aesthetic
  3. PDF.js worker configuration functions correctly in production environment

**Plans**: 2 plans

Plans:
- [x] 01-01-PLAN.md — Next.js initialization, shadcn/ui Stone theme, minimal UI structure
- [x] 01-02-PLAN.md — PDF.js worker configuration, Vercel deployment, production validation

---

### Phase 2: Core RSVP Engine
**Goal**: Users can read text with RSVP display featuring precise center letter highlighting, customizable word grouping, and variable speed control.

**Depends on**: Phase 1

**Requirements**: RSVP-01, RSVP-02, RSVP-03, RSVP-04, RSVP-05, RSVP-06, RSVP-07, RSVP-08, UI-01, UI-02

**Success Criteria** (what must be TRUE):
  1. User sees words displayed in configurable groups (1-N words) at screen center
  2. Center letter of middle word is highlighted using ORP calculation (30-40% from word start)
  3. User can adjust reading speed (200-1000 WPM) before and during reading without timing drift
  4. User can change word group size during active reading session
  5. Display maintains 60fps at all WPM settings using RAF-based timing

**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md — Core engine (RAF timing, ORP calculator, word grouper, Zustand stores)
- [x] 02-02-PLAN.md — RSVP display components (RSVPDisplay, controls, settings panel, integration)

**Note**: User requested frontend-design skill for UI component implementation. RSVP-09 (variable speed by word length) deferred as optional enhancement per research.

---

### Phase 3: PDF Integration
**Goal**: Users can upload PDFs up to 50MB, extract text without UI blocking, navigate via table of contents, and select sections for RSVP reading.

**Depends on**: Phase 2

**Requirements**: PDF-01, PDF-02, PDF-03, PDF-04, PDF-05, PDF-06, UI-04, PERF-01, PERF-02, PERF-03

**Success Criteria** (what must be TRUE):
  1. User can upload PDF files up to 50MB via drag-and-drop interface
  2. PDF text extraction completes in under 5 seconds without blocking UI
  3. User can navigate document via extracted table of contents (when available)
  4. User can manually select page ranges when PDF lacks TOC structure
  5. User can return to TOC/section selection after completing reading session
  6. Application remains responsive during PDF processing using Web Worker architecture

**Plans**: 3 plans

Plans:
- [ ] 03-01-PLAN.md — Web Worker infrastructure, PDF upload UI, progress tracking
- [ ] 03-02-PLAN.md — Text extraction with lazy page loading, RSVP integration
- [ ] 03-03-PLAN.md — TOC extraction (outline + heuristics), navigation UI, page range selection

---

### Phase 4: Controls & Polish
**Goal**: Users can control reading sessions with keyboard shortcuts, pause/resume functionality, progress tracking, and persistent settings across browser sessions.

**Depends on**: Phase 3

**Requirements**: CTRL-01, CTRL-02, CTRL-03, CTRL-04, CTRL-05, CTRL-06, UI-03

**Success Criteria** (what must be TRUE):
  1. User can pause and resume reading from exact position
  2. User can restart current section from beginning
  3. User can control reading with keyboard shortcuts (space, arrows, escape)
  4. User sees progress bar showing position in current section
  5. Reading position persists across browser sessions (returns to last position on reload)
  6. Settings (speed, word grouping, preferences) persist across sessions

**Plans**: TBD (1-2 plans estimated)

Plans:
- [ ] 04-01: TBD during planning

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Foundation | 2/2 | Complete | 2025-01-18 |
| 2. Core RSVP Engine | 2/2 | Complete | 2025-01-18 |
| 3. PDF Integration | 0/3 | Not started | - |
| 4. Controls & Polish | 0/TBD | Not started | - |

---
*Roadmap created: 2025-01-18*
*Depth: Quick (4 phases)*
*Coverage: 29/29 v1 requirements mapped*
