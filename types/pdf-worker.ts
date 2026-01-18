/**
 * PDF Extraction Worker Message Protocol
 *
 * Type definitions for communication between main thread and PDF extraction worker.
 * Uses discriminated unions for type-safe message handling.
 */

/**
 * Table of Contents item
 * Represents a single entry in the document outline/navigation
 */
export interface TOCItem {
  title: string
  pageIndex: number  // 0-indexed page number
  level: number      // Hierarchy level (0 = top level, 1 = subsection, etc.)
}

/**
 * Result returned from PDF extraction worker
 * Contains all extracted data from PDF document
 */
export interface PDFExtractionResult {
  text: string           // Full extracted text from all pages
  outline: TOCItem[]     // Table of contents (empty array if not available)
  pageCount: number      // Total number of pages in document
  filename: string       // Original filename for reference
}

/**
 * Messages sent TO worker from main thread
 * Discriminated union for type safety
 */
export type WorkerRequest =
  | {
      type: 'extract'
      buffer: ArrayBuffer  // PDF file data (transferred, not copied)
      filename: string
    }
  | {
      type: 'cancel'
    }

/**
 * Messages received FROM worker in main thread
 * Discriminated union for type safety
 */
export type WorkerResponse =
  | {
      type: 'progress'
      progress: number  // Percentage complete (0-100)
    }
  | {
      type: 'complete'
      result: PDFExtractionResult
    }
  | {
      type: 'error'
      error: string  // Human-readable error message
    }
