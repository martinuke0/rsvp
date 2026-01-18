/**
 * PDF Extraction Web Worker
 *
 * Runs in a separate thread to extract text from PDF files without blocking UI.
 * Uses PDF.js for parsing and extraction. Communicates via postMessage protocol.
 *
 * Architecture:
 * - Main thread transfers ArrayBuffer to this worker
 * - Worker loads PDF with PDF.js (which uses its own internal worker)
 * - Worker extracts page count (text extraction deferred to Plan 03-02)
 * - Worker reports progress and sends result back to main thread
 */

import * as pdfjsLib from 'pdfjs-dist'
import type { WorkerRequest, WorkerResponse, PDFExtractionResult } from '@/types/pdf-worker'

// Configure PDF.js to use its internal worker
// Worker file must be in public folder and served from root path
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

/**
 * Message handler for extraction requests
 * Listens for 'extract' and 'cancel' messages from main thread
 */
self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const message = e.data

  // Handle cancel request
  if (message.type === 'cancel') {
    // Future: implement cancellation logic
    // For now, termination is handled by main thread
    return
  }

  // Handle extract request
  if (message.type === 'extract') {
    try {
      const { buffer, filename } = message

      // Load PDF document from ArrayBuffer
      // PDF.js handles the heavy lifting of PDF parsing
      const loadingTask = pdfjsLib.getDocument({ data: buffer })
      const pdf = await loadingTask.promise

      // For Plan 03-01: Extract ONLY page count
      // Full text extraction with lazy page loading will be implemented in Plan 03-02
      const pageCount = pdf.numPages

      // Report progress immediately after loading (100% for this minimal extraction)
      const progressResponse: WorkerResponse = {
        type: 'progress',
        progress: 100
      }
      self.postMessage(progressResponse)

      // Send minimal result back to main thread
      const result: PDFExtractionResult = {
        text: '', // Empty for now - will be populated in Plan 03-02
        outline: [], // Empty for now - TOC extraction in Plan 03-03
        pageCount,
        filename
      }

      const completeResponse: WorkerResponse = {
        type: 'complete',
        result
      }
      self.postMessage(completeResponse)

    } catch (error) {
      // Structured error handling - send error details to main thread
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during PDF extraction'

      const errorResponse: WorkerResponse = {
        type: 'error',
        error: errorMessage
      }
      self.postMessage(errorResponse)
    }
  }
}

/**
 * Global error handler for uncaught worker errors
 * Ensures main thread receives error notification even if message handler fails
 */
self.onerror = (event: string | Event) => {
  const message = typeof event === 'string' ? event : (event as ErrorEvent).message || 'Unknown worker error'
  const errorResponse: WorkerResponse = {
    type: 'error',
    error: `Worker error: ${message}`
  }
  self.postMessage(errorResponse)
}
