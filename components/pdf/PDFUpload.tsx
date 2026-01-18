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
import { Upload } from 'lucide-react'

interface PDFUploadProps {
  onFileSelected: (file: File) => void
}

export default function PDFUpload({ onFileSelected }: PDFUploadProps) {
  // Component state (simplified - extraction handled by parent hook)
  const [isDragOver, setIsDragOver] = useState(false)

  // Hidden file input ref for click-to-browse
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Handle file selection (no extraction here - delegated to parent)
   */
  const handleFileSelected = useCallback((file: File) => {
    // Notify parent component to handle extraction
    onFileSelected(file)
  }, [onFileSelected])

  /**
   * Handle file drop
   */
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)

    // Get first file from drop
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelected(file)
    }
  }, [handleFileSelected])

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
      handleFileSelected(file)
    }
  }, [handleFileSelected])

  // Render: Drag-and-drop zone (extraction state managed by parent)
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
