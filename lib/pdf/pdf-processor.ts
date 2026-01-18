/**
 * PDF Processor
 *
 * Main thread coordinator for PDF extraction worker lifecycle.
 * Manages worker creation, message passing, cleanup, and error handling.
 *
 * Usage:
 *   const processor = new PDFProcessor({ onProgress: (p) => console.log(p) })
 *   const result = await processor.extractText(file)
 */

import type {
  WorkerRequest,
  WorkerResponse,
  PDFExtractionResult
} from '@/types/pdf-worker'

/**
 * Configuration options for PDFProcessor
 */
interface PDFProcessorOptions {
  onProgress?: (progress: number) => void
}

/**
 * Main thread class for coordinating PDF extraction via Web Worker
 */
export class PDFProcessor {
  private worker: Worker | null = null
  private onProgress?: (progress: number) => void

  constructor(options?: PDFProcessorOptions) {
    this.onProgress = options?.onProgress
  }

  /**
   * Extract text from PDF file using Web Worker
   *
   * @param file - PDF file to extract text from
   * @returns Promise resolving to extraction result
   * @throws Error if file validation fails, extraction fails, or timeout occurs
   */
  async extractText(file: File): Promise<PDFExtractionResult> {
    // Validate file size (50MB limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`PDF file exceeds 50MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`)
    }

    // Validate file type
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      throw new Error('File must be a PDF')
    }

    // Create worker using webpack 5 URL-based import syntax
    // This ensures worker file is properly bundled and accessible
    this.worker = new Worker(
      new URL('./pdf-extraction-worker.ts', import.meta.url)
    )

    // Return promise that resolves when worker completes
    return new Promise<PDFExtractionResult>((resolve, reject) => {
      // Set 30-second timeout for extraction
      const timeout = setTimeout(() => {
        reject(new Error('PDF extraction timeout (30s) - file may be too complex'))
        this.cleanup()
      }, 30000)

      // Handle worker messages
      this.worker!.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const message = e.data

        if (message.type === 'progress') {
          // Report progress to callback if provided
          this.onProgress?.(message.progress)
        } else if (message.type === 'complete') {
          // Extraction succeeded
          clearTimeout(timeout)
          resolve(message.result)
          this.cleanup()
        } else if (message.type === 'error') {
          // Extraction failed
          clearTimeout(timeout)
          reject(new Error(message.error))
          this.cleanup()
        }
      }

      // Handle worker errors (uncaught exceptions)
      this.worker!.onerror = (error: ErrorEvent) => {
        clearTimeout(timeout)
        reject(new Error(`Worker error: ${error.message}`))
        this.cleanup()
      }

      // Transfer ArrayBuffer to worker
      // Using transferable objects for zero-copy transfer (performance optimization)
      file.arrayBuffer().then(buffer => {
        const request: WorkerRequest = {
          type: 'extract',
          buffer,
          filename: file.name
        }

        // Transfer ownership of ArrayBuffer to worker thread
        // This is more efficient than copying for large files
        this.worker!.postMessage(request, [buffer])
      }).catch(err => {
        clearTimeout(timeout)
        reject(new Error(`Failed to read file: ${err.message}`))
        this.cleanup()
      })
    })
  }

  /**
   * Cancel ongoing extraction
   * Sends cancel message to worker and cleans up
   */
  cancel(): void {
    if (this.worker) {
      const request: WorkerRequest = { type: 'cancel' }
      this.worker.postMessage(request)
      this.cleanup()
    }
  }

  /**
   * Clean up worker resources
   * Terminates worker and releases reference
   */
  private cleanup(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
  }
}
