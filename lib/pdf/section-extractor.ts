/**
 * Section Text Extraction Utility
 *
 * Extracts text content for specific page ranges from full PDF text.
 * Works with text extracted by worker (pages concatenated with '\n' separators).
 *
 * This is a synchronous utility function - no async operations needed since
 * text is already extracted. Fast execution via simple string splitting.
 */

/**
 * Extract text content for a specific page range from full PDF text
 *
 * @param fullText - Complete PDF text (pages concatenated with '\n')
 * @param startPage - Starting page number (1-indexed, inclusive)
 * @param endPage - Ending page number (1-indexed, inclusive)
 * @param totalPages - Total number of pages in document
 * @returns Text content for specified page range
 *
 * @example
 * const text = "Page 1\nPage 2\nPage 3\nPage 4\nPage 5"
 * const section = extractSectionText(text, 2, 4, 5)
 * // Returns: "Page 2\nPage 3\nPage 4"
 */
export function extractSectionText(
  fullText: string,
  startPage: number,
  endPage: number,
  totalPages: number
): string {
  // Optimization: if requesting full document, return unchanged
  if (startPage === 1 && endPage === totalPages) {
    return fullText
  }

  // Validate page range (1-indexed)
  if (
    startPage < 1 ||
    endPage > totalPages ||
    startPage > endPage ||
    totalPages < 1
  ) {
    console.warn(
      `Invalid page range: ${startPage}-${endPage} of ${totalPages} pages`
    )
    return ''
  }

  // Split fullText by newlines to get array of page texts
  // Worker concatenates pages with '\n' separator (see pdf-extraction-worker.ts)
  const pages = fullText.split('\n')

  // Handle case where split produces fewer items than expected
  // (PDF extraction may have failed on some pages)
  if (pages.length < totalPages) {
    console.warn(
      `Expected ${totalPages} pages but split produced ${pages.length} items`
    )
  }

  // Extract page range (convert to 0-indexed for array access)
  // startPage 1 = index 0, endPage 3 = index 3 (exclusive in slice)
  const sectionPages = pages.slice(startPage - 1, endPage)

  // Join selected pages back with newlines
  return sectionPages.join('\n')
}
