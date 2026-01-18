/**
 * TOC Extraction with Heuristic Fallback
 *
 * Extracts table of contents from PDF documents using two strategies:
 * 1. Structured outline parsing (if PDF has embedded bookmarks)
 * 2. Font-based heuristic detection (fallback for PDFs without outlines)
 *
 * Research shows only ~30% of PDFs have proper bookmarks, so heuristic
 * fallback is essential for broad PDF compatibility.
 */

import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { TOCItem } from '@/types/pdf-worker'

/**
 * Extract table of contents from PDF document
 * Tries structured outline first, falls back to font-based heuristics
 *
 * @param pdf - PDF.js document proxy
 * @returns Array of TOC items (may be empty if no structure detected)
 */
export async function extractTableOfContents(
  pdf: PDFDocumentProxy
): Promise<TOCItem[]> {
  try {
    // Try structured outline first (only ~30% of PDFs have this)
    const outline = await pdf.getOutline()

    if (outline && outline.length > 0) {
      // PDF has embedded bookmarks - parse structured outline
      return await parseOutlineToTOC(pdf, outline)
    }

    // No structured outline - fall back to font-based heuristic detection
    return await detectTOCFromFonts(pdf)
  } catch (error) {
    console.warn('TOC extraction failed:', error)
    return [] // Return empty array on error (non-blocking)
  }
}

/**
 * Parse structured PDF outline into flat TOC items
 * Recursively traverses outline tree, resolving destinations to page indices
 *
 * @param pdf - PDF.js document proxy
 * @param outline - Raw outline from pdf.getOutline()
 * @param level - Current hierarchy level (increments on recursion)
 * @returns Flattened array of TOC items preserving hierarchy via level field
 */
async function parseOutlineToTOC(
  pdf: PDFDocumentProxy,
  outline: any[],
  level: number = 0
): Promise<TOCItem[]> {
  const items: TOCItem[] = []

  for (const node of outline) {
    try {
      // Resolve destination to page index
      let pageIndex = 0

      if (node.dest) {
        // Destination can be string (named) or array (direct)
        if (typeof node.dest === 'string') {
          // Named destination - need to look up
          const dest = await pdf.getDestination(node.dest)
          if (dest && dest[0]) {
            pageIndex = await pdf.getPageIndex(dest[0])
          }
        } else if (Array.isArray(node.dest) && node.dest[0]) {
          // Direct destination - first element is page reference
          pageIndex = await pdf.getPageIndex(node.dest[0])
        }
      }

      // Add TOC item with title, page index, and hierarchy level
      items.push({
        title: node.title || 'Untitled',
        pageIndex,
        level,
      })

      // Recursively process children (if any)
      if (node.items && node.items.length > 0) {
        const childItems = await parseOutlineToTOC(pdf, node.items, level + 1)
        items.push(...childItems)
      }
    } catch (error) {
      // Skip failed nodes (malformed destinations, etc.) but continue processing
      console.warn('Failed to parse outline node:', node.title, error)
    }
  }

  return items
}

/**
 * Detect TOC structure from font size and styling patterns
 * Scans first 20 pages looking for text that's larger than average
 * (typically chapter titles, section headers, etc.)
 *
 * @param pdf - PDF.js document proxy
 * @returns Array of TOC items detected via heuristics (may be empty)
 */
async function detectTOCFromFonts(pdf: PDFDocumentProxy): Promise<TOCItem[]> {
  const items: TOCItem[] = []
  const maxPagesToScan = Math.min(20, pdf.numPages) // Scan first 20 pages max

  for (let pageNum = 1; pageNum <= maxPagesToScan; pageNum++) {
    try {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()

      // Calculate average font size for baseline comparison
      const fontSizes = textContent.items
        .map((item: any) => item.height || 0)
        .filter((size: number) => size > 0)

      if (fontSizes.length === 0) {
        page.cleanup()
        continue
      }

      const avgFontSize =
        fontSizes.reduce((sum: number, size: number) => sum + size, 0) /
        fontSizes.length

      // Find text items with font size significantly larger than average
      for (const item of textContent.items) {
        const textItem = item as any
        const fontSize = textItem.height || 0
        const text = textItem.str?.trim() || ''

        // Heuristic filters for likely headers:
        // 1. Font size > 1.3x average (noticeably larger)
        // 2. Length 3-100 characters (not too short, not body text)
        // 3. Contains alphanumeric content
        // 4. Not all uppercase (excludes page headers/footers)
        if (
          fontSize > avgFontSize * 1.3 &&
          text.length >= 3 &&
          text.length <= 100 &&
          /[a-zA-Z0-9]/.test(text) &&
          text !== text.toUpperCase()
        ) {
          // Estimate hierarchy level based on font size ratio
          const sizeRatio = fontSize / avgFontSize
          const level = sizeRatio >= 2.0 ? 0 : sizeRatio >= 1.5 ? 1 : 2

          items.push({
            title: text,
            pageIndex: pageNum - 1, // Convert to 0-indexed
            level,
          })
        }
      }

      // CRITICAL: Release page memory immediately
      page.cleanup()
    } catch (error) {
      console.warn(`Failed to scan page ${pageNum} for TOC:`, error)
      // Continue scanning other pages
    }
  }

  // Deduplicate by page + title (same title on same page)
  const uniqueItems = items.filter(
    (item, index, self) =>
      index ===
      self.findIndex(
        (t) => t.pageIndex === item.pageIndex && t.title === item.title
      )
  )

  // Sort by page order
  return uniqueItems.sort((a, b) => a.pageIndex - b.pageIndex)
}
