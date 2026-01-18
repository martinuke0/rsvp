import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'

/**
 * Initialize PDF.js worker configuration
 * MUST be called before any PDF operations
 * Call this in a useEffect or during component initialization
 */
export function initPDFWorker() {
  if (typeof window === 'undefined') {
    return // Server-side, skip
  }

  // Point to worker file in public folder (served from root URL path)
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
}

/**
 * Load PDF from File object
 * Returns PDF document proxy
 */
export async function loadPDFFromFile(file: File): Promise<PDFDocumentProxy> {
  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  return loadingTask.promise
}
