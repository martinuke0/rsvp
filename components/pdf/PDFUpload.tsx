'use client'

/**
 * PDF Upload Component
 *
 * Drag-and-drop upload interface for PDF files with progress tracking.
 * Uses PDFProcessor to extract text via Web Worker (non-blocking).
 *
 * Features:
 * - Drag-and-drop zone with visual feedback
 * - Click to browse file system
 * - Real-time progress display during extraction
 * - Error handling with retry option
 * - File size and type validation
 */

import { useState, useRef, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Upload, AlertCircle } from 'lucide-react'
import { PDFProcessor } from '@/lib/pdf/pdf-processor'
import type { PDFExtractionResult } from '@/types/pdf-worker'

interface PDFUploadProps {
  onUploadComplete: (result: PDFExtractionResult) => void
}

export default function PDFUpload({ onUploadComplete }: PDFUploadProps) {
  // Component state
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  // Hidden file input ref for click-to-browse
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Process PDF file using worker
   */
  const processFile = useCallback(async (file: File) => {
    setIsUploading(true)
    setProgress(0)
    setError(null)

    try {
      // Create processor with progress callback
      const processor = new PDFProcessor({
        onProgress: (p) => setProgress(p)
      })

      // Extract text via worker (non-blocking)
      const result = await processor.extractText(file)

      // Success - notify parent component
      onUploadComplete(result)
    } catch (err) {
      // Handle extraction errors
      const errorMessage = err instanceof Error ? err.message : 'Failed to process PDF'
      setError(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }, [onUploadComplete])

  /**
   * Handle file drop
   */
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)

    // Get first file from drop
    const file = e.dataTransfer.files[0]
    if (file) {
      processFile(file)
    }
  }, [processFile])

  /**
   * Handle drag over (required to enable drop)
   */
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  /**
   * Handle click to browse
   */
  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  /**
   * Handle file input change
   */
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }, [processFile])

  /**
   * Handle retry after error
   */
  const handleRetry = useCallback(() => {
    setError(null)
    setProgress(0)
  }, [])

  // Render: Uploading state
  if (isUploading) {
    return (
      <Card className="p-8 border-2 border-dashed">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-full max-w-xs">
            <Progress value={progress} />
          </div>
          <p className="text-sm text-muted-foreground">
            Processing PDF... {Math.round(progress)}%
          </p>
        </div>
      </Card>
    )
  }

  // Render: Error state
  if (error) {
    return (
      <Card className="p-8 border-2 border-red-500">
        <div className="flex flex-col items-center justify-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <div className="text-center">
            <p className="text-sm font-semibold text-red-500 mb-2">Error Processing PDF</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button variant="outline" onClick={handleRetry}>
            Try Again
          </Button>
        </div>
      </Card>
    )
  }

  // Render: Idle state (drag-and-drop zone)
  return (
    <>
      <Card
        className={`p-8 border-2 border-dashed transition-colors cursor-pointer ${
          isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <Upload className="h-16 w-16 text-muted-foreground" />
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">
              Drag and drop PDF here
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Maximum file size: 50MB
            </p>
          </div>
        </div>
      </Card>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  )
}
