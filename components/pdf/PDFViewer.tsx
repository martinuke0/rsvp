'use client'

import { useState, useEffect } from 'react'
import { initPDFWorker, loadPDFFromFile } from '@/lib/pdf-config'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { Card } from '@/components/ui/card'

interface PDFViewerProps {
  file: File | null
}

export default function PDFViewer({ file }: PDFViewerProps) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Initialize worker once on mount
  useEffect(() => {
    initPDFWorker()
  }, [])

  // Load PDF when file changes
  useEffect(() => {
    if (!file) {
      setPdf(null)
      return
    }

    setLoading(true)
    setError(null)

    loadPDFFromFile(file)
      .then((loadedPdf) => {
        setPdf(loadedPdf)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [file])

  if (!file) {
    return null
  }

  if (loading) {
    return <Card className="p-6">Loading PDF...</Card>
  }

  if (error) {
    return <Card className="p-6 border-red-500">Error loading PDF: {error}</Card>
  }

  if (pdf) {
    return (
      <Card className="p-6">
        <p className="text-lg font-semibold">PDF loaded successfully</p>
        <p className="text-sm text-muted-foreground mt-2">
          Pages: {pdf.numPages}
        </p>
      </Card>
    )
  }

  return null
}
