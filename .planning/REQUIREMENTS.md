# Requirements: RSVP Speed Reader

**Defined:** 2025-01-18
**Core Value:** Effective speed reading through precise focal point guidance - the center letter highlight combined with customizable word grouping and speed control enables readers to maintain focus and comprehension at accelerated reading speeds.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### PDF Processing

- [x] **PDF-01**: User can upload PDF files up to 50MB
- [x] **PDF-02**: System extracts text from PDF on client-side (no server upload)
- [x] **PDF-03**: System extracts table of contents from PDF structure if available
- [x] **PDF-04**: User can manually select page range when PDF lacks TOC
- [x] **PDF-05**: User can navigate to different sections via TOC
- [x] **PDF-06**: User can return to TOC/section selection after reading session

### RSVP Engine

- [x] **RSVP-01**: System displays words in groups at center of screen
- [x] **RSVP-02**: System highlights center letter of middle word in each group
- [x] **RSVP-03**: User can customize word group size (1-N words per flash)
- [x] **RSVP-04**: User can adjust reading speed (WPM) before reading
- [x] **RSVP-05**: User can adjust reading speed mid-reading
- [x] **RSVP-06**: User can adjust word grouping size mid-reading
- [x] **RSVP-07**: System uses RAF-based timing for precise word display intervals
- [x] **RSVP-08**: System calculates center letter using ORP algorithm (30-40% from word start)

### Reading Controls

- [ ] **CTRL-01**: User can pause reading
- [ ] **CTRL-02**: User can resume reading from pause point
- [ ] **CTRL-03**: User can restart current section from beginning
- [ ] **CTRL-04**: User can control reading with keyboard shortcuts (Space = play/pause, Escape = back to navigation, R = restart)
- [ ] **CTRL-05**: System persists reading position across browser sessions
- [ ] **CTRL-06**: System displays progress bar showing position in current section

### Settings & UI

- [x] **UI-01**: System provides settings panel for reading preferences
- [x] **UI-02**: System uses minimalist, modern design with shadcn components
- [ ] **UI-03**: System persists user settings (WPM, word grouping) across browser sessions
- [x] **UI-04**: User can preview document structure before reading

### Performance

- [x] **PERF-01**: PDF text extraction completes in under 5 seconds for 50MB files
- [x] **PERF-02**: RSVP display maintains 60fps at all WPM settings
- [x] **PERF-03**: System uses Web Worker for PDF processing to avoid UI blocking

### Deployment

- [x] **DEPLOY-01**: Application deploys successfully to Vercel
- [x] **DEPLOY-02**: PDF.js worker configuration works in Vercel production environment

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

- **RSVP-09**: System adjusts display time based on word length (variable speed)
- **ADV-01**: System automatically pauses briefly at sentence boundaries
- **ADV-02**: System supports adaptive word grouping by phrase structure

### Advanced Controls

- **CTRL-07**: User can skip forward/backward with arrow keys (deferred - unclear what this means in RSVP context where there is no visual scan path)

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
| PDF-01 | Phase 3 | Complete |
| PDF-02 | Phase 3 | Complete |
| PDF-03 | Phase 3 | Complete |
| PDF-04 | Phase 3 | Complete |
| PDF-05 | Phase 3 | Complete |
| PDF-06 | Phase 3 | Complete |
| RSVP-01 | Phase 2 | Complete |
| RSVP-02 | Phase 2 | Complete |
| RSVP-03 | Phase 2 | Complete |
| RSVP-04 | Phase 2 | Complete |
| RSVP-05 | Phase 2 | Complete |
| RSVP-06 | Phase 2 | Complete |
| RSVP-07 | Phase 2 | Complete |
| RSVP-08 | Phase 2 | Complete |
| CTRL-01 | Phase 4 | Pending |
| CTRL-02 | Phase 4 | Pending |
| CTRL-03 | Phase 4 | Pending |
| CTRL-04 | Phase 4 | Pending |
| CTRL-05 | Phase 4 | Pending |
| CTRL-06 | Phase 4 | Pending |
| UI-01 | Phase 2 | Complete |
| UI-02 | Phase 1 | Complete |
| UI-03 | Phase 2 | Complete (via settings-store persist middleware) |
| UI-04 | Phase 3 | Complete |
| PERF-01 | Phase 3 | Complete |
| PERF-02 | Phase 3 | Complete |
| PERF-03 | Phase 3 | Complete |
| DEPLOY-01 | Phase 1 | Complete |
| DEPLOY-02 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 29 total
- Mapped to phases: 29/29 ✓
- Unmapped: 0

---
*Requirements defined: 2025-01-18*
*Last updated: 2025-01-18 after Phase 4 checker revision (clarified CTRL-04 shortcuts, confirmed UI-03 status)*
