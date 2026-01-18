/**
 * Page Range Selector Component
 *
 * Manual page range selection UI for PDFs without table of contents.
 * Enables users to specify start and end pages for reading.
 *
 * Features:
 * - Validates page range (start must be ≥ 1 and ≤ pageCount)
 * - Ensures end ≥ start and end ≤ pageCount
 * - Shows error messages for invalid ranges
 * - Disables submit until valid range entered
 * - Default: pages 1 to min(10, pageCount)
 *
 * Created in Plan 03-04 Task 2
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, FileText } from 'lucide-react'

interface PageRangeSelectorProps {
  pageCount: number
  onRangeSelect: (start: number, end: number) => void
}

export function PageRangeSelector({
  pageCount,
  onRangeSelect,
}: PageRangeSelectorProps) {
  // Default to first 10 pages (or fewer if document is shorter)
  const [startPage, setStartPage] = useState(1)
  const [endPage, setEndPage] = useState(Math.min(10, pageCount))
  const [error, setError] = useState<string | null>(null)

  /**
   * Validate page range
   * Returns error message if invalid, null if valid
   */
  const validateRange = (): string | null => {
    if (startPage < 1) {
      return 'Start page must be at least 1'
    }
    if (startPage > pageCount) {
      return `Start page cannot exceed ${pageCount}`
    }
    if (endPage < startPage) {
      return 'End page must be greater than or equal to start page'
    }
    if (endPage > pageCount) {
      return `End page cannot exceed ${pageCount}`
    }
    return null
  }

  /**
   * Handle form submission
   * Validates range and calls callback if valid
   */
  const handleSubmit = () => {
    const validationError = validateRange()

    if (validationError) {
      setError(validationError)
      return
    }

    // Clear error and submit
    setError(null)
    onRangeSelect(startPage, endPage)
  }

  // Check if current range is valid
  const isValid = validateRange() === null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Select Page Range
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Total pages: {pageCount}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Input fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-page">From page</Label>
            <Input
              id="start-page"
              type="number"
              min={1}
              max={pageCount}
              value={startPage}
              onChange={(e) => {
                setStartPage(parseInt(e.target.value) || 1)
                setError(null)
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-page">To page</Label>
            <Input
              id="end-page"
              type="number"
              min={1}
              max={pageCount}
              value={endPage}
              onChange={(e) => {
                setEndPage(parseInt(e.target.value) || 1)
                setError(null)
              }}
            />
          </div>
        </div>

        {/* Submit button */}
        <Button
          onClick={handleSubmit}
          disabled={!isValid}
          className="w-full"
        >
          Load Section
        </Button>
      </CardContent>
    </Card>
  )
}
