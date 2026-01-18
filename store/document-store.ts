/**
 * Document store using Zustand.
 *
 * Stores current PDF document metadata and extracted content.
 * Used by Plan 03-03 for TOC navigation and section selection.
 */
import { create } from 'zustand'
import type { TOCItem } from '@/types/pdf-worker'

interface DocumentState {
  // Document metadata
  filename: string | null
  pageCount: number
  text: string
  outline: TOCItem[]

  // Actions
  setDocument: (filename: string, pageCount: number, text: string, outline: TOCItem[]) => void
  clear: () => void
}

export const useDocumentStore = create<DocumentState>((set) => ({
  // Initial state
  filename: null,
  pageCount: 0,
  text: '',
  outline: [],

  // Actions
  setDocument: (filename, pageCount, text, outline) =>
    set({
      filename,
      pageCount,
      text,
      outline,
    }),

  clear: () =>
    set({
      filename: null,
      pageCount: 0,
      text: '',
      outline: [],
    }),
}))
