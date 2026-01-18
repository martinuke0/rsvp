/**
 * TOC Navigation Component
 *
 * Displays hierarchical table of contents for PDF documents.
 * Enables users to navigate to specific sections via clickable TOC items.
 *
 * Features:
 * - Hierarchical indentation based on level (0 = no indent, 1 = 1rem, 2 = 2rem, etc.)
 * - Shows page numbers for each item
 * - Highlights current section
 * - Scrollable list for long TOCs
 *
 * Created in Plan 03-04 Task 1
 */

'use client'

import { useDocumentStore } from '@/store/document-store'
import type { TOCItem } from '@/types/pdf-worker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, ChevronRight } from 'lucide-react'

interface TOCNavigationProps {
  onSectionSelect: (item: TOCItem) => void
}

export function TOCNavigation({ onSectionSelect }: TOCNavigationProps) {
  const filename = useDocumentStore((state) => state.filename)
  const outline = useDocumentStore((state) => state.outline)
  const currentSection = useDocumentStore((state) => state.currentSection)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Table of Contents
        </CardTitle>
        {filename && (
          <p className="text-sm text-muted-foreground">{filename}</p>
        )}
      </CardHeader>
      <CardContent>
        {outline.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No table of contents available</p>
            <p className="text-sm mt-2">
              Use the page range selector below to manually select pages
            </p>
          </div>
        ) : (
          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {outline.map((item, index) => {
              // Check if this item is the current section
              const isCurrent =
                currentSection &&
                currentSection.startPage === item.pageIndex + 1

              return (
                <Button
                  key={index}
                  variant={isCurrent ? 'secondary' : 'ghost'}
                  className="w-full justify-between text-left h-auto py-2 px-3"
                  style={{
                    paddingLeft: `${0.75 + item.level * 1}rem`,
                  }}
                  onClick={() => onSectionSelect(item)}
                >
                  <span className="flex items-center gap-2 flex-1 truncate">
                    <ChevronRight className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{item.title}</span>
                  </span>
                  <span className="text-muted-foreground text-sm flex-shrink-0 ml-2">
                    p. {item.pageIndex + 1}
                  </span>
                </Button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
