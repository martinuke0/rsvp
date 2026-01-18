/**
 * PDF Extraction Hook
 *
 * React hook that orchestrates PDF extraction and RSVP integration.
 * Manages extraction state, progress tracking, and integration with reading store.
 *
 * Usage:
 *   const { isExtracting, progress, error, extractPDF } = usePDFExtraction()
 *   await extractPDF(file, wordsPerGroup)
 */

import { useState, useCallback } from 'react'
import { PDFProcessor } from '@/lib/pdf/pdf-processor'
import { groupWords } from '@/lib/rsvp/word-grouper'
import { useReadingStore } from '@/store/reading-store'
import { useDocumentStore } from '@/store/document-store'
import type { PDFExtractionResult } from '@/types/pdf-worker'

interface UsePDFExtractionResult {
  isExtracting: boolean
  progress: number
  error: string | null
  extractPDF: (file: File, wordsPerGroup: number) => Promise<void>
  cancel: () => void
}

export function usePDFExtraction(): UsePDFExtractionResult {
  // State management
  const [isExtracting, setIsExtracting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [processor, setProcessor] = useState<PDFProcessor | null>(null)

  /**
   * Extract PDF and initialize RSVP reading
   * Chains: extraction → grouping → RSVP initialization → document store
   */
  const extractPDF = useCallback(async (file: File, wordsPerGroup: number) => {
    try {
      // Reset state
      setIsExtracting(true)
      setProgress(0)
      setError(null)

      // Create processor with progress callback
      const newProcessor = new PDFProcessor({
        onProgress: (p) => setProgress(p)
      })
      setProcessor(newProcessor)

      // Extract text via worker
      const result: PDFExtractionResult = await newProcessor.extractText(file)

      // Store document metadata (enables TOC navigation in Plan 03-03)
      useDocumentStore.getState().setDocument(
        result.filename,
        result.pageCount,
        result.text,
        result.outline
      )

      // Group words for RSVP display
      const groupedWords = groupWords(result.text, wordsPerGroup)

      // Initialize RSVP store with grouped words
      useReadingStore.getState().initialize(groupedWords)

      // Success
      setIsExtracting(false)
    } catch (err) {
      // Handle errors
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during PDF extraction'
      setError(errorMessage)
      setIsExtracting(false)
    }
  }, [])

  /**
   * Cancel ongoing extraction
   */
  const cancel = useCallback(() => {
    if (processor) {
      processor.cancel()
      setProcessor(null)
    }
    setIsExtracting(false)
    setProgress(0)
  }, [processor])

  return {
    isExtracting,
    progress,
    error,
    extractPDF,
    cancel,
  }
}
