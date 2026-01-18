/**
 * Document store using Zustand.
 *
 * Stores current PDF document metadata and extracted content.
 * Used by Plan 03-03 for TOC navigation and section selection.
 *
 * Separation of concerns: Document metadata (TOC, page count) is independent
 * from reading state (current word, playback). This enables document navigation
 * without affecting RSVP playback state.
 */
import { create } from 'zustand'
import type { TOCItem } from '@/types/pdf-worker'

interface DocumentState {
  // Document metadata
  filename: string | null
  pageCount: number
  text: string
  outline: TOCItem[]

  // Current section (for reading specific page ranges)
  currentSection: {
    startPage: number
    endPage: number
    text: string
  } | null

  // Actions
  setDocument: (filename: string, pageCount: number, text: string, outline: TOCItem[]) => void
  setSection: (startPage: number, endPage: number) => void
  clear: () => void
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  // Initial state
  filename: null,
  pageCount: 0,
  text: '',
  outline: [],
  currentSection: null,

  // Actions
  setDocument: (filename, pageCount, text, outline) =>
    set({
      filename,
      pageCount,
      text,
      outline,
    }),

  setSection: (startPage, endPage) => {
    const state = get()

    // Extract text for the specified page range
    // Since worker concatenates pages with '\n', split and slice
    const pages = state.text.split('\n')

    // Validate page range (1-indexed)
    if (startPage < 1 || endPage > state.pageCount || startPage > endPage) {
      console.warn('Invalid page range:', startPage, endPage)
      set({ currentSection: null })
      return
    }

    // Extract pages (convert to 0-indexed for array access)
    const sectionPages = pages.slice(startPage - 1, endPage)
    const sectionText = sectionPages.join('\n')

    set({
      currentSection: {
        startPage,
        endPage,
        text: sectionText,
      },
    })
  },

  clear: () =>
    set({
      filename: null,
      pageCount: 0,
      text: '',
      outline: [],
      currentSection: null,
    }),
}))
