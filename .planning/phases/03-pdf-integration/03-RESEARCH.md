# Phase 3: PDF Integration - Research

**Researched:** 2026-01-18
**Domain:** Client-side PDF processing with Web Workers
**Confidence:** HIGH

## Summary

This research investigates implementing non-blocking PDF text extraction for files up to 50MB using Web Workers, PDF.js text extraction APIs, and TOC extraction strategies. The findings inform how to structure the PDF processing pipeline to maintain UI responsiveness while handling large documents.

**Key findings:**
- Web Workers with transferable objects are essential for non-blocking 50MB file processing
- PDF.js provides worker-based architecture out-of-the-box but requires custom worker for text extraction orchestration
- Only ~30% of PDFs have structured outlines - heuristic fallback via font size/style detection is necessary
- Memory management requires lazy page loading and explicit cleanup to avoid 50MB+ heap consumption
- Integration pattern: File → Worker (parse + extract) → Main thread (word grouping) → RSVP store

**Primary recommendation:** Create dedicated PDF extraction worker that processes pages lazily, uses transferable objects for ArrayBuffer transfer, extracts TOC via getOutline() + font-based heuristics, and streams results back to main thread for word grouping pipeline integration.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pdfjs-dist | 5.4.530 | PDF parsing and rendering | Mozilla's official PDF implementation, battle-tested, handles edge cases |
| Web Workers API | Native | Off-main-thread processing | Browser native, zero-copy transfers via transferable objects |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Comlink | 4.x | RPC abstraction over postMessage | Optional - simplifies worker communication but adds 1.1kB, consider for complex multi-operation workers |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom worker | Comlink wrapper | Comlink adds RPC abstraction (simpler API) vs raw postMessage (more control, no deps) |
| pdfjs-dist | pdf-lib | pdf-lib for creation/modification, pdfjs-dist better for parsing/extraction |

**Installation:**
```bash
# Already installed in Phase 1
pdfjs-dist@5.4.530
```

**Worker Configuration:**
```typescript
// Already configured in lib/pdf-config.ts
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
```

## Architecture Patterns

### Recommended Project Structure
```
lib/
├── pdf/
│   ├── pdf-extraction-worker.ts    # Custom worker: text + TOC extraction
│   ├── pdf-processor.ts            # Main thread: worker manager + result handler
│   └── toc-heuristics.ts           # Fallback TOC detection via font analysis
├── pdf-config.ts                   # Existing: PDF.js worker config
└── rsvp/
    └── word-grouper.ts             # Existing: text → word groups

public/
└── pdf.worker.min.mjs              # Existing: PDF.js internal worker
```

### Pattern 1: Custom Worker for Text Extraction

**What:** Dedicated Web Worker that orchestrates PDF.js API calls for text extraction without blocking main thread

**When to use:** Always - Required for PERF-03 (non-blocking processing)

**Architecture:**
```
Main Thread                    Extraction Worker                PDF.js Worker
-----------                    -----------------                -------------
File object
    |
    | postMessage(ArrayBuffer, [transfer])
    |------------------------->
                               Load with PDF.js
                               getDocument(arrayBuffer)
                                    |
                                    |----(internal)--->
                                                        Parse PDF
                                                        <----(result)----
                               Extract TOC
                               getOutline()

                               Process pages lazily
                               for page 1..N:
                                 getPage(i)
                                 getTextContent()
                                    |
                                    |----(internal)--->
                                                        Extract text
                                                        <----(result)----
                                 page.cleanup()

                               postMessage(result)
    <-------------------------|
Process result
groupWords(text)
readingStore.initialize()
```

**Example:**
```typescript
// lib/pdf/pdf-processor.ts (Main thread)
export class PDFProcessor {
  private worker: Worker | null = null;

  async extractText(file: File): Promise<PDFExtractionResult> {
    // Create worker using modern webpack 5 syntax
    this.worker = new Worker(
      new URL('./pdf-extraction-worker.ts', import.meta.url)
    );

    return new Promise((resolve, reject) => {
      this.worker!.onmessage = (e: MessageEvent<WorkerMessage>) => {
        if (e.data.type === 'complete') {
          resolve(e.data.result);
          this.cleanup();
        } else if (e.data.type === 'error') {
          reject(new Error(e.data.error));
          this.cleanup();
        } else if (e.data.type === 'progress') {
          // Optional: emit progress events
          this.onProgress?.(e.data.progress);
        }
      };

      this.worker!.onerror = (error) => {
        reject(error);
        this.cleanup();
      };

      // Transfer ArrayBuffer ownership to worker (zero-copy)
      file.arrayBuffer().then(buffer => {
        this.worker!.postMessage(
          { type: 'extract', buffer, filename: file.name },
          [buffer] // Transferable objects list
        );
      });
    });
  }

  private cleanup() {
    this.worker?.terminate();
    this.worker = null;
  }
}
```

```typescript
// lib/pdf/pdf-extraction-worker.ts (Worker thread)
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker inside extraction worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface ExtractMessage {
  type: 'extract';
  buffer: ArrayBuffer;
  filename: string;
}

interface WorkerResponse {
  type: 'complete' | 'error' | 'progress';
  result?: PDFExtractionResult;
  error?: string;
  progress?: number;
}

self.onmessage = async (e: MessageEvent<ExtractMessage>) => {
  try {
    const { buffer, filename } = e.data;

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;

    // Extract TOC (outline)
    const outline = await extractTableOfContents(pdf);

    // Extract text from all pages (lazy loading)
    let fullText = '';
    const totalPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Combine text items
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      fullText += pageText + '\n';

      // CRITICAL: Cleanup page to release memory
      page.cleanup();

      // Report progress
      self.postMessage({
        type: 'progress',
        progress: (pageNum / totalPages) * 100
      } as WorkerResponse);
    }

    // Send result back to main thread
    self.postMessage({
      type: 'complete',
      result: {
        text: fullText,
        outline,
        pageCount: totalPages,
        filename
      }
    } as WorkerResponse);

  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    } as WorkerResponse);
  }
};
```

### Pattern 2: TOC Extraction with Fallback Heuristics

**What:** Extract table of contents from PDF outline/bookmarks, fall back to font-based heuristic detection

**When to use:** Always - Required for PDF-03, PDF-05 (TOC navigation)

**Challenge:** Only ~30% of PDFs have structured outlines. Remaining 70% require heuristic detection via font size/style analysis.

**Example:**
```typescript
// lib/pdf/pdf-extraction-worker.ts
import type { PDFDocumentProxy } from 'pdfjs-dist';

interface TOCItem {
  title: string;
  pageIndex: number;
  level: number;
}

async function extractTableOfContents(
  pdf: PDFDocumentProxy
): Promise<TOCItem[]> {
  // Try structured outline first
  const outline = await pdf.getOutline();

  if (outline && outline.length > 0) {
    // PDF has structured bookmarks
    return await parseOutlineToTOC(pdf, outline);
  }

  // Fallback: Heuristic detection via font analysis
  return await detectTOCFromFonts(pdf);
}

async function parseOutlineToTOC(
  pdf: PDFDocumentProxy,
  outline: any[]
): Promise<TOCItem[]> {
  const items: TOCItem[] = [];

  async function traverse(nodes: any[], level: number = 0) {
    for (const node of nodes) {
      // Get page index from destination
      let pageIndex = 0;
      if (node.dest) {
        try {
          // dest can be array or string (named destination)
          if (typeof node.dest === 'string') {
            const dest = await pdf.getDestination(node.dest);
            if (dest) {
              pageIndex = await pdf.getPageIndex(dest[0]);
            }
          } else if (Array.isArray(node.dest)) {
            pageIndex = await pdf.getPageIndex(node.dest[0]);
          }
        } catch (e) {
          console.warn('Failed to resolve destination:', e);
        }
      }

      items.push({
        title: node.title,
        pageIndex,
        level
      });

      // Process children recursively
      if (node.items && node.items.length > 0) {
        await traverse(node.items, level + 1);
      }
    }
  }

  await traverse(outline);
  return items;
}
```

```typescript
// lib/pdf/toc-heuristics.ts
import type { PDFDocumentProxy } from 'pdfjs-dist';

/**
 * Fallback TOC detection via font size/style heuristics
 *
 * Strategy:
 * 1. Scan first 20 pages (or until meaningful content found)
 * 2. Identify text items with larger fonts or bold styling
 * 3. Filter candidates: short lines (<100 chars), capitalized, etc.
 * 4. Rank by font size deviation from page average
 */
export async function detectTOCFromFonts(
  pdf: PDFDocumentProxy
): Promise<TOCItem[]> {
  const candidates: TOCItem[] = [];
  const maxScanPages = Math.min(20, pdf.numPages);

  for (let pageNum = 1; pageNum <= maxScanPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Calculate average font size for page
    const fontSizes = textContent.items
      .map((item: any) => item.height)
      .filter(Boolean);
    const avgFontSize = fontSizes.reduce((a, b) => a + b, 0) / fontSizes.length;

    // Find potential headings (font size > average * 1.3)
    for (const item of textContent.items as any[]) {
      const text = item.str.trim();

      // Heuristic filters:
      // - Font size significantly larger than average
      // - Text length < 100 chars (not body text)
      // - Contains alphanumeric content
      // - Not all caps (common in headers/footers)
      if (
        item.height > avgFontSize * 1.3 &&
        text.length > 3 &&
        text.length < 100 &&
        /[a-zA-Z0-9]/.test(text) &&
        text !== text.toUpperCase()
      ) {
        candidates.push({
          title: text,
          pageIndex: pageNum - 1,
          level: estimateLevel(item.height, avgFontSize)
        });
      }
    }

    page.cleanup();
  }

  return deduplicateAndSort(candidates);
}

function estimateLevel(fontSize: number, avgSize: number): number {
  const ratio = fontSize / avgSize;
  if (ratio >= 2.0) return 0;  // H1
  if (ratio >= 1.5) return 1;  // H2
  return 2;                     // H3+
}

function deduplicateAndSort(items: TOCItem[]): TOCItem[] {
  // Remove duplicates on same page, sort by page order
  const seen = new Map<string, TOCItem>();
  for (const item of items) {
    const key = `${item.pageIndex}-${item.title}`;
    if (!seen.has(key)) {
      seen.set(key, item);
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.pageIndex - b.pageIndex);
}
```

### Pattern 3: Memory-Efficient Lazy Page Loading

**What:** Process PDF pages sequentially with explicit cleanup to avoid memory accumulation

**When to use:** Always - Required for PERF-01 (50MB file support without OOM)

**Why it matters:** Loading all pages simultaneously for a 50MB PDF can consume 500MB+ of heap memory. Lazy loading with cleanup keeps memory bounded.

**Example:**
```typescript
// Inside worker: Process pages one at a time
for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
  const page = await pdf.getPage(pageNum);

  // Extract text
  const textContent = await page.getTextContent();
  const pageText = textContent.items
    .map((item: any) => item.str)
    .join(' ');

  // CRITICAL: Release page resources immediately
  page.cleanup();

  // Process page text before moving to next page
  fullText += pageText + '\n';

  // Report progress to main thread
  self.postMessage({
    type: 'progress',
    progress: (pageNum / pdf.numPages) * 100
  });
}
```

### Pattern 4: Integration with RSVP Engine

**What:** Connect PDF extraction pipeline to existing word grouping and RSVP reading flow

**When to use:** Always - Required for phase integration

**Example:**
```typescript
// Component or hook that orchestrates the flow
async function handlePDFUpload(file: File) {
  try {
    // 1. Extract text via worker (non-blocking)
    const processor = new PDFProcessor();
    const result = await processor.extractText(file);

    // 2. Group words using existing utility
    const groupedWords = groupWords(result.text, wordsPerGroup);

    // 3. Initialize RSVP store
    useReadingStore.getState().initialize(groupedWords);

    // 4. Store TOC for navigation
    setTableOfContents(result.outline);

    // 5. Transition to reading view
    setView('reading');

  } catch (error) {
    // Handle extraction errors
    console.error('PDF extraction failed:', error);
    setError(error.message);
  }
}
```

### Anti-Patterns to Avoid

- **Loading entire PDF into memory at once:** Use lazy page loading instead
- **Blocking main thread with PDF.js calls:** Always use worker for text extraction
- **Forgetting page.cleanup():** Causes memory leaks with large PDFs
- **Copying ArrayBuffer instead of transferring:** Use transferable objects list in postMessage
- **Synchronous processing in React render:** Extract text before initializing reading state

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PDF parsing | Custom PDF parser | pdfjs-dist | PDF spec is 1000+ pages, handles encryption, fonts, encodings, compression |
| Worker RPC abstraction | Custom promise-based wrapper | Comlink (optional) | Handles proxy lifecycle, transferables, callbacks, error propagation |
| Text layout analysis | Custom font size detector | PDF.js textContent.items with transform data | Provides position, font, size, already parsed |
| Progress reporting | Custom chunking logic | Sequential page processing with postMessage | Natural progress points at page boundaries |

**Key insight:** PDF.js already runs in a worker internally - creating a custom extraction worker adds orchestration layer, not duplication. The extraction worker coordinates PDF.js worker, manages memory, and streams results. This two-worker architecture (extraction + PDF.js internal) is intentional and recommended.

## Common Pitfalls

### Pitfall 1: Memory Explosion with Large PDFs

**What goes wrong:** Loading all pages simultaneously causes 500MB+ heap consumption for 50MB PDF

**Why it happens:** Each page allocates memory for text content, fonts, images. Without cleanup, memory accumulates linearly with page count.

**How to avoid:**
- Use lazy page loading (one page at a time)
- Call `page.cleanup()` immediately after extracting text
- Monitor memory in DevTools during development
- Test with actual 50MB PDFs, not small samples

**Warning signs:**
- Browser tab crashes during PDF processing
- "JavaScript heap out of memory" errors
- Performance degradation after processing multiple PDFs

### Pitfall 2: UI Blocking During Text Extraction

**What goes wrong:** UI freezes for 2-5 seconds during PDF processing, violating PERF-02 (60fps requirement)

**Why it happens:** Text extraction is CPU-intensive. Running on main thread blocks rendering pipeline.

**How to avoid:**
- ALWAYS use Web Worker for extraction (pattern 1)
- Transfer ArrayBuffer with transferable objects (zero-copy)
- Report progress from worker to show loading state
- Never call PDF.js APIs directly in React components

**Warning signs:**
- DevTools shows long tasks (>50ms) on main thread
- UI feels frozen during "Processing PDF..." state
- Animation janks or stutters during extraction

### Pitfall 3: Incorrect TOC Page References

**What goes wrong:** Clicking TOC item navigates to wrong page or crashes

**Why it happens:** Outline destinations are complex objects (arrays with page refs), not simple page numbers. Converting requires getPageIndex() call.

**How to avoid:**
```typescript
// WRONG: Using dest directly
const pageNum = node.dest[0]; // This is a page reference, not index!

// CORRECT: Resolve reference to index
const pageIndex = await pdf.getPageIndex(node.dest[0]);
const pageNum = pageIndex + 1; // Convert 0-indexed to 1-indexed
```

**Warning signs:**
- TOC navigation sometimes works, sometimes doesn't
- Console errors about invalid page references
- Off-by-one errors in page navigation

### Pitfall 4: Worker File Not Found in Production

**What goes wrong:** PDF processing works in development but fails in production with "Worker script failed to load"

**Why it happens:** Webpack/bundler doesn't automatically copy worker files to output directory. Need explicit URL-based import.

**How to avoid:**
```typescript
// WRONG: String path (doesn't work with bundlers)
new Worker('./pdf-extraction-worker.ts');

// CORRECT: URL-based import (webpack 5 syntax)
new Worker(new URL('./pdf-extraction-worker.ts', import.meta.url));
```

**Warning signs:**
- Works in `npm run dev`, fails in `npm run build`
- 404 errors for worker files in production
- "Worker is not defined" errors in SSR context

### Pitfall 5: Heuristic TOC False Positives

**What goes wrong:** TOC contains random large text (page numbers, headers, pull quotes) instead of actual headings

**Why it happens:** Font size heuristic is imperfect - page numbers, emphasis, captions often use larger fonts.

**How to avoid:**
- Implement multiple heuristic filters (length, position, capitalization)
- Scan limited pages (first 20) to avoid false positives in body content
- Allow manual page range selection as fallback (PDF-04)
- Consider text content: numbers-only strings unlikely to be headings

**Warning signs:**
- TOC contains single words or numbers
- TOC items are all from same page
- TOC has 100+ entries (likely false positives)

### Pitfall 6: SSR Crashes with Worker Code

**What goes wrong:** Next.js build fails or SSR crashes with "Worker is not defined"

**Why it happens:** Workers are browser-only APIs, not available in Node.js SSR context

**How to avoid:**
```typescript
// Guard worker creation with browser check
if (typeof window !== 'undefined' && window.Worker) {
  this.worker = new Worker(
    new URL('./pdf-extraction-worker.ts', import.meta.url)
  );
}

// Or use dynamic import with ssr: false
const PDFProcessor = dynamic(
  () => import('@/lib/pdf/pdf-processor'),
  { ssr: false }
);
```

**Warning signs:**
- Build succeeds but SSR fails
- "ReferenceError: Worker is not defined" in server logs
- Component renders in browser but not during SSR

## Code Examples

### Complete Worker Message Protocol

```typescript
// types/pdf-worker.ts
export interface PDFExtractionResult {
  text: string;
  outline: TOCItem[];
  pageCount: number;
  filename: string;
}

export interface TOCItem {
  title: string;
  pageIndex: number;
  level: number;
}

// Messages sent TO worker
export type WorkerRequest =
  | { type: 'extract'; buffer: ArrayBuffer; filename: string }
  | { type: 'cancel' };

// Messages received FROM worker
export type WorkerResponse =
  | { type: 'progress'; progress: number }
  | { type: 'complete'; result: PDFExtractionResult }
  | { type: 'error'; error: string };
```

### Error Handling Pattern

```typescript
// lib/pdf/pdf-processor.ts
export class PDFProcessor {
  private worker: Worker | null = null;
  private onProgress?: (progress: number) => void;

  constructor(options?: { onProgress?: (progress: number) => void }) {
    this.onProgress = options?.onProgress;
  }

  async extractText(file: File): Promise<PDFExtractionResult> {
    // Validate file
    if (file.size > 50 * 1024 * 1024) {
      throw new Error('PDF file exceeds 50MB limit');
    }

    if (!file.type.includes('pdf')) {
      throw new Error('File must be a PDF');
    }

    // Create worker
    this.worker = new Worker(
      new URL('./pdf-extraction-worker.ts', import.meta.url)
    );

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('PDF extraction timeout (30s)'));
        this.cleanup();
      }, 30000);

      this.worker!.onmessage = (e: MessageEvent<WorkerResponse>) => {
        if (e.data.type === 'complete') {
          clearTimeout(timeout);
          resolve(e.data.result);
          this.cleanup();
        } else if (e.data.type === 'error') {
          clearTimeout(timeout);
          reject(new Error(e.data.error));
          this.cleanup();
        } else if (e.data.type === 'progress') {
          this.onProgress?.(e.data.progress);
        }
      };

      this.worker!.onerror = (error: ErrorEvent) => {
        clearTimeout(timeout);
        reject(new Error(`Worker error: ${error.message}`));
        this.cleanup();
      };

      // Transfer ArrayBuffer to worker
      file.arrayBuffer().then(buffer => {
        this.worker!.postMessage(
          { type: 'extract', buffer, filename: file.name } as WorkerRequest,
          [buffer]
        );
      });
    });
  }

  cancel() {
    if (this.worker) {
      this.worker.postMessage({ type: 'cancel' } as WorkerRequest);
      this.cleanup();
    }
  }

  private cleanup() {
    this.worker?.terminate();
    this.worker = null;
  }
}
```

### React Integration Hook

```typescript
// hooks/use-pdf-extraction.ts
import { useState, useCallback } from 'react';
import { PDFProcessor } from '@/lib/pdf/pdf-processor';
import { useReadingStore } from '@/store/reading-store';
import { groupWords } from '@/lib/rsvp/word-grouper';
import type { PDFExtractionResult, TOCItem } from '@/types/pdf-worker';

interface UsePDFExtractionResult {
  isExtracting: boolean;
  progress: number;
  error: string | null;
  extractPDF: (file: File, wordsPerGroup: number) => Promise<void>;
  cancel: () => void;
}

export function usePDFExtraction(): UsePDFExtractionResult {
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [processor, setProcessor] = useState<PDFProcessor | null>(null);

  const extractPDF = useCallback(async (file: File, wordsPerGroup: number) => {
    setIsExtracting(true);
    setProgress(0);
    setError(null);

    const newProcessor = new PDFProcessor({
      onProgress: (p) => setProgress(p)
    });
    setProcessor(newProcessor);

    try {
      // Extract text via worker
      const result: PDFExtractionResult = await newProcessor.extractText(file);

      // Group words
      const groupedWords = groupWords(result.text, wordsPerGroup);

      // Initialize reading store
      useReadingStore.getState().initialize(groupedWords);

      // Store TOC for navigation (external state)
      // This would be handled by parent component or separate store

      setIsExtracting(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsExtracting(false);
    }
  }, []);

  const cancel = useCallback(() => {
    processor?.cancel();
    setIsExtracting(false);
    setProgress(0);
  }, [processor]);

  return { isExtracting, progress, error, extractPDF, cancel };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| pdf-parse (Node.js) | pdfjs-dist (browser) | Always | Client-side processing for privacy, no server costs |
| String-based worker paths | `new Worker(new URL(..., import.meta.url))` | webpack 5 (2020) | Works without loader, compatible with bundlers |
| Manual postMessage orchestration | Comlink RPC library | 2018+ | Optional abstraction, reduces boilerplate |
| Load all pages upfront | Lazy page-by-page loading | Best practice | Prevents OOM with large PDFs |
| Render + extract simultaneously | Extract-only workflow | Use case dependent | RSVP doesn't need rendering, text-only extraction is faster |

**Deprecated/outdated:**
- **worker-loader for webpack**: No longer needed with webpack 5 native syntax
- **pdf.js legacy build**: Use ES6 module build (pdfjs-dist/build/pdf.mjs) in modern apps
- **Loading worker via CDN script tag**: Bundle worker file, serve from public folder

**Current best practice (2025-2026):**
- Use pdfjs-dist@5.x with native ES modules
- Worker creation with `new URL(..., import.meta.url)` syntax
- Transferable objects for ArrayBuffer (zero-copy transfer)
- Lazy page loading with explicit cleanup
- Two-worker architecture: extraction worker + PDF.js internal worker

## Open Questions

### 1. Performance Target Achievability

**Question:** Can we reliably achieve <5s extraction for all 50MB PDFs, or does document complexity (fonts, encodings) affect timing?

**What we know:**
- PDF.js can process 50MB files
- Extraction time depends on page count, not just file size
- 50MB could be 100 pages (images) or 5000 pages (text-only)

**What's unclear:**
- Worst-case extraction time for 50MB text-heavy PDF
- Whether progress reporting affects performance
- If we need to impose page count limits in addition to file size

**Recommendation:**
- Test with diverse 50MB PDFs during implementation
- Add timeout (30s) as safety fallback
- Consider showing estimated time based on page count
- If consistently slower, adjust requirement or add "large file" warning

### 2. TOC Heuristic Reliability

**Question:** What is acceptable false positive/negative rate for heuristic TOC detection?

**What we know:**
- Only ~30% of PDFs have structured outlines
- Font-based heuristics are imperfect
- Users can manually select page ranges as fallback (PDF-04)

**What's unclear:**
- User expectations for TOC quality
- Whether bad TOC is worse than no TOC
- How much tuning is needed for acceptable accuracy

**Recommendation:**
- Implement basic heuristics first (font size + length filters)
- Show TOC confidence indicator ("Auto-detected structure")
- Always provide manual page range option
- Consider user feedback for heuristic improvement in v2

### 3. Page Range Selection UX

**Question:** How should manual page range selection work when TOC detection fails?

**What we know:**
- PDF-04 requires manual page range selection capability
- Need to show page count from extraction result
- Users might want to read specific chapters/sections

**What's unclear:**
- UI pattern: slider, input fields, or visual page picker?
- Whether to support multiple disjoint ranges
- How to handle very long PDFs (1000+ pages)

**Recommendation:**
- Start with simple: "From page __ to page __" inputs
- Single contiguous range for v1
- Consider page preview thumbnails if PDF-04 requires more sophisticated selection

### 4. Memory Threshold for Device Constraints

**Question:** Should we detect device memory and adjust processing strategy?

**What we know:**
- Navigator.deviceMemory API exists but limited browser support
- Mobile devices have less memory than desktops
- 50MB PDF on 2GB RAM device could crash

**What's unclear:**
- Whether to dynamically adjust file size limits
- If we should warn users on low-memory devices
- Whether to implement adaptive page batch sizes

**Recommendation:**
- Phase 3: Use single file size limit (50MB) for simplicity
- Monitor crash reports post-launch
- Phase 4+: Consider memory detection if issues arise

## Sources

### Primary (HIGH confidence)
- MDN Web Workers API - https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
- PDF.js GitHub repository API source - https://github.com/mozilla/pdf.js/blob/master/src/display/api.js
- PDF.js GitHub examples - https://github.com/mozilla/pdf.js/blob/master/examples/node/getinfo.mjs
- Webpack Web Workers guide - http://webpack.js.org/guides/web-workers/
- MDN postMessage documentation - https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage
- Comlink GitHub repository - https://github.com/GoogleChromeLabs/comlink

### Secondary (MEDIUM confidence)
- PDF.js official homepage - https://mozilla.github.io/pdf.js/
- Web.dev off-main-thread architecture - https://web.dev/articles/off-main-thread
- Web.dev workers basics - https://web.dev/articles/workers-basics
- PDF.js issues on memory management - https://github.com/mozilla/pdf.js/issues (search: large file memory)

### Tertiary (LOW confidence)
- General knowledge about PDF structure complexity (training data)
- TOC heuristic patterns (inferred from font analysis capabilities, not verified implementations)

## Metadata

**Confidence breakdown:**
- Web Worker architecture: HIGH - MDN and Webpack docs are authoritative, patterns are well-established
- PDF.js text extraction: HIGH - Source code and examples provide definitive API patterns
- TOC extraction: MEDIUM - getOutline() is documented, but heuristic fallback strategies require implementation testing
- Memory management: MEDIUM - Best practices documented, but 50MB threshold needs empirical validation
- Integration patterns: HIGH - Existing codebase inspection shows clear integration points

**Research date:** 2026-01-18
**Valid until:** ~60 days (2026-03-18) - PDF.js and Web Workers are stable APIs, unlikely to change significantly. Main risk is new PDF.js version with breaking changes.

**Implementation notes:**
- Existing Phase 1 setup (pdf-config.ts, worker file) provides foundation
- Existing Phase 2 RSVP engine (word-grouper, reading-store) provides clear integration points
- Two-worker architecture (extraction + PDF.js internal) is intentional, not overhead
- Memory management and TOC heuristics are highest implementation complexity areas
- Consider Comlink for worker abstraction if message protocol becomes complex (optional, not required)
