# Requirements: RSVP Speed Reader

**Defined:** 2025-01-18
**Core Value:** Effective speed reading through precise focal point guidance - the center letter highlight combined with customizable word grouping and speed control enables readers to maintain focus and comprehension at accelerated reading speeds.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### PDF Processing

- [ ] **PDF-01**: User can upload PDF files up to 50MB
- [ ] **PDF-02**: System extracts text from PDF on client-side (no server upload)
- [ ] **PDF-03**: System extracts table of contents from PDF structure if available
- [ ] **PDF-04**: User can manually select page range when PDF lacks TOC
- [ ] **PDF-05**: User can navigate to different sections via TOC
- [ ] **PDF-06**: User can return to TOC/section selection after reading session

### RSVP Engine

- [ ] **RSVP-01**: System displays words in groups at center of screen
- [ ] **RSVP-02**: System highlights center letter of middle word in each group
- [ ] **RSVP-03**: User can customize word group size (1-N words per flash)
- [ ] **RSVP-04**: User can adjust reading speed (WPM) before reading
- [ ] **RSVP-05**: User can adjust reading speed mid-reading
- [ ] **RSVP-06**: User can adjust word grouping size mid-reading
- [ ] **RSVP-07**: System uses RAF-based timing for precise word display intervals
- [ ] **RSVP-08**: System calculates center letter using ORP algorithm (30-40% from word start)
- [ ] **RSVP-09**: System adjusts display time based on word length (variable speed)

### Reading Controls

- [ ] **CTRL-01**: User can pause reading
- [ ] **CTRL-02**: User can resume reading from pause point
- [ ] **CTRL-03**: User can restart current section from beginning
- [ ] **CTRL-04**: User can control reading with keyboard shortcuts (space, arrows)
- [ ] **CTRL-05**: System persists reading position across browser sessions
- [ ] **CTRL-06**: System displays progress bar showing position in current section

### Settings & UI

- [ ] **UI-01**: System provides settings panel for reading preferences
- [ ] **UI-02**: System uses minimalist, modern design with shadcn components
- [ ] **UI-03**: System persists user settings across sessions
- [ ] **UI-04**: User can preview document structure before reading

### Performance

- [ ] **PERF-01**: PDF text extraction completes in under 5 seconds for 50MB files
- [ ] **PERF-02**: RSVP display maintains 60fps at all WPM settings
- [ ] **PERF-03**: System uses Web Worker for PDF processing to avoid UI blocking

### Deployment

- [ ] **DEPLOY-01**: Application deploys successfully to Vercel
- [ ] **DEPLOY-02**: PDF.js worker configuration works in Vercel production environment

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Display Customization

- **DISP-01**: User can adjust font size
- **DISP-02**: User can switch between light and dark themes

### Document Enhancement

- **DOC-01**: System detects scanned PDFs and warns user (no text available)
- **DOC-02**: User can bookmark sections for quick access
- **DOC-03**: System displays reading statistics (WPM, time spent, pages completed)

### Advanced Reading

- **ADV-01**: System automatically pauses briefly at sentence boundaries
- **ADV-02**: System supports adaptive word grouping by phrase structure

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| User accounts/authentication | Single session model, no backend |
| Backend storage | Privacy requirement - client-side only |
| Document library/history | Documents cleared on browser close |
| Multi-document support | One PDF at a time simplifies v1 |
| Mobile-specific optimizations | Web-first, responsive design deferred |
| Text-to-speech | Breaks RSVP flow and focal point benefit |
| Simultaneous highlighting | Distracts from center letter focus |
| Social features (sharing, comments) | Out of scope for reading tool |
| Cloud sync | Conflicts with client-side architecture |
| OCR for scanned PDFs | High complexity, specialized use case |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PDF-01 | Phase 3 | Pending |
| PDF-02 | Phase 3 | Pending |
| PDF-03 | Phase 3 | Pending |
| PDF-04 | Phase 3 | Pending |
| PDF-05 | Phase 3 | Pending |
| PDF-06 | Phase 3 | Pending |
| RSVP-01 | Phase 2 | Pending |
| RSVP-02 | Phase 2 | Pending |
| RSVP-03 | Phase 2 | Pending |
| RSVP-04 | Phase 2 | Pending |
| RSVP-05 | Phase 2 | Pending |
| RSVP-06 | Phase 2 | Pending |
| RSVP-07 | Phase 2 | Pending |
| RSVP-08 | Phase 2 | Pending |
| RSVP-09 | Phase 2 | Pending |
| CTRL-01 | Phase 4 | Pending |
| CTRL-02 | Phase 4 | Pending |
| CTRL-03 | Phase 4 | Pending |
| CTRL-04 | Phase 4 | Pending |
| CTRL-05 | Phase 4 | Pending |
| CTRL-06 | Phase 4 | Pending |
| UI-01 | Phase 2 | Pending |
| UI-02 | Phase 1 | Complete |
| UI-03 | Phase 4 | Pending |
| UI-04 | Phase 3 | Pending |
| PERF-01 | Phase 3 | Pending |
| PERF-02 | Phase 3 | Pending |
| PERF-03 | Phase 3 | Pending |
| DEPLOY-01 | Phase 1 | Complete |
| DEPLOY-02 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 29/29 ✓
- Unmapped: 0

---
*Requirements defined: 2025-01-18*
*Last updated: 2025-01-18 after roadmap creation*
