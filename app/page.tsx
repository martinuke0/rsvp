'use client';

import { useState, useEffect, useCallback } from 'react';
import { RSVPDisplay } from '@/components/reader/RSVPDisplay';
import { RSVPControls } from '@/components/reader/RSVPControls';
import { SettingsPanel } from '@/components/reader/SettingsPanel';
import PDFUpload from '@/components/pdf/PDFUpload';
import { TOCNavigation } from '@/components/pdf/TOCNavigation';
import { PageRangeSelector } from '@/components/pdf/PageRangeSelector';
import { useReadingStore } from '@/store/reading-store';
import { useSettingsStore } from '@/store/settings-store';
import { useDocumentStore } from '@/store/document-store';
import { usePDFExtraction } from '@/hooks/use-pdf-extraction';
import { groupWords } from '@/lib/rsvp/word-grouper';
import { extractSectionText } from '@/lib/pdf/section-extractor';
import type { TOCItem } from '@/types/pdf-worker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, ArrowLeft } from 'lucide-react';

const SAMPLE_TEXT = `Rapid Serial Visual Presentation (RSVP) is a technique for displaying text in which words are presented one at a time at a specific location on the screen. This method eliminates eye movement and enables reading speeds of 300-1000 words per minute while maintaining comprehension. The key to effective RSVP is the Optimal Recognition Point (ORP), positioned at approximately 30-40% from the start of each word, which aligns with natural eye fixation patterns discovered through eye-tracking research.`;

export default function Home() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [view, setView] = useState<'upload' | 'navigation' | 'reading'>('upload');
  const initialize = useReadingStore((state) => state.initialize);
  const reset = useReadingStore((state) => state.reset);
  const wordsPerGroup = useSettingsStore((state) => state.wordsPerGroup);

  // PDF extraction hook
  const { isExtracting, progress, error, extractPDF } = usePDFExtraction();

  const handleLoadText = useCallback(() => {
    if (text.trim()) {
      const grouped = groupWords(text, wordsPerGroup);
      initialize(grouped);
    }
  }, [text, wordsPerGroup, initialize]);

  const handleReset = useCallback(() => {
    reset();
    useDocumentStore.getState().clear();
    setText(SAMPLE_TEXT);
  }, [reset]);

  /**
   * Handle PDF upload completion
   * After extraction, show navigation view
   */
  const handlePDFUpload = useCallback(async (file: File) => {
    await extractPDF(file, wordsPerGroup);
    // After extraction completes, show navigation view
    setView('navigation');
  }, [extractPDF, wordsPerGroup]);

  /**
   * Handle TOC item selection
   * Extracts section text and initializes RSVP
   */
  const handleTOCSelect = useCallback((item: TOCItem) => {
    const doc = useDocumentStore.getState();
    const outline = doc.outline;

    // Find next TOC item to determine section end page
    const currentIndex = outline.indexOf(item);
    const nextItem = outline[currentIndex + 1];
    const endPage = nextItem ? nextItem.pageIndex : doc.pageCount;

    // Extract section text (pageIndex is 0-based, need 1-based for extraction)
    const sectionText = extractSectionText(
      doc.text,
      item.pageIndex + 1,
      endPage,
      doc.pageCount
    );

    // Group words and initialize RSVP
    const groupedWords = groupWords(sectionText, wordsPerGroup);
    initialize(groupedWords);

    // Store section info
    doc.setSection(item.pageIndex + 1, endPage);

    // Check for saved position
    const savedIndex = useReadingStore.getState().restorePosition();
    if (savedIndex !== null && savedIndex < groupedWords.length) {
      // Restore position
      useReadingStore.getState().setCurrentWord(groupedWords[savedIndex], savedIndex);
    }

    // Switch to reading view
    setView('reading');
  }, [wordsPerGroup, initialize]);

  /**
   * Handle page range selection
   * Extracts page range text and initializes RSVP
   */
  const handleRangeSelect = useCallback((start: number, end: number) => {
    const doc = useDocumentStore.getState();

    // Extract section text
    const sectionText = extractSectionText(doc.text, start, end, doc.pageCount);

    // Group words and initialize RSVP
    const groupedWords = groupWords(sectionText, wordsPerGroup);
    initialize(groupedWords);

    // Store section info
    doc.setSection(start, end);

    // Check for saved position
    const savedIndex = useReadingStore.getState().restorePosition();
    if (savedIndex !== null && savedIndex < groupedWords.length) {
      // Restore position
      useReadingStore.getState().setCurrentWord(groupedWords[savedIndex], savedIndex);
    }

    // Switch to reading view
    setView('reading');
  }, [wordsPerGroup, initialize]);

  /**
   * Handle full document reading
   * Loads entire document for RSVP
   */
  const handleFullDocument = useCallback(() => {
    const doc = useDocumentStore.getState();

    // Group words and initialize RSVP
    const groupedWords = groupWords(doc.text, wordsPerGroup);
    initialize(groupedWords);

    // Store section info (full document)
    doc.setSection(1, doc.pageCount);

    // Check for saved position
    const savedIndex = useReadingStore.getState().restorePosition();
    if (savedIndex !== null && savedIndex < groupedWords.length) {
      // Restore position
      useReadingStore.getState().setCurrentWord(groupedWords[savedIndex], savedIndex);
    }

    // Switch to reading view
    setView('reading');
  }, [wordsPerGroup, initialize]);

  /**
   * Handle back to navigation
   * Returns to navigation view, pauses RSVP, preserves reading position
   */
  const handleBackToNavigation = useCallback(() => {
    const doc = useDocumentStore.getState();

    if (doc.filename) {
      // Save position before pausing
      if (doc.currentSection) {
        useReadingStore.getState().savePosition(doc.filename, doc.currentSection);
      }

      // Pause RSVP playback (preserve current position)
      useReadingStore.getState().setIsPlaying(false);

      // Return to navigation view (document state preserved)
      setView('navigation');
    }
  }, []);

  /**
   * Handle restart
   * Resets reading to first word and stops playback
   */
  const handleRestart = useCallback(() => {
    // Stop playback
    useReadingStore.getState().setIsPlaying(false);

    // Get words array
    const words = useReadingStore.getState().words;

    // Reset to first word
    if (words.length > 0) {
      useReadingStore.getState().setCurrentWord(words[0], 0);
    }
  }, []);

  /**
   * Global keyboard shortcut handler
   * Space: toggle play/pause
   * Escape: back to navigation
   * R: restart section
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Guard: Do not trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          // Space: toggle play/pause
          e.preventDefault(); // Prevent page scroll
          const isPlaying = useReadingStore.getState().isPlaying;
          useReadingStore.getState().setIsPlaying(!isPlaying);
          break;

        case 'Escape':
          // Escape: back to navigation (only in reading view)
          e.preventDefault();
          if (view === 'reading') {
            handleBackToNavigation();
          }
          break;

        case 'r':
        case 'R':
          // R: restart section
          e.preventDefault();
          handleRestart();
          break;

        case 'ArrowUp':
          // Arrow Up: increase WPM by 50
          e.preventDefault();
          const currentWPM = useSettingsStore.getState().wpm;
          const newWPM = Math.min(currentWPM + 50, 1000); // Max 1000
          useSettingsStore.getState().setWPM(newWPM);
          break;

        case 'ArrowDown':
          // Arrow Down: decrease WPM by 50
          e.preventDefault();
          const currentWPMDown = useSettingsStore.getState().wpm;
          const newWPMDown = Math.max(currentWPMDown - 50, 100); // Min 100
          useSettingsStore.getState().setWPM(newWPMDown);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup function prevents memory leak
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, handleBackToNavigation, handleRestart]);

  // Auto-load sample text on mount
  useEffect(() => {
    handleLoadText();
  }, [handleLoadText]);

  /**
   * Periodic auto-save during playback
   * Saves position every 5 seconds to prevent loss on browser crash
   */
  useEffect(() => {
    const reading = useReadingStore.getState();
    const doc = useDocumentStore.getState();

    // Only save if actively reading a document section
    if (reading.isPlaying && doc.filename && doc.currentSection) {
      // Auto-save every 5 seconds during playback
      const interval = setInterval(() => {
        const currentReading = useReadingStore.getState();
        const currentDoc = useDocumentStore.getState();
        if (currentReading.isPlaying && currentDoc.filename && currentDoc.currentSection) {
          currentReading.savePosition(currentDoc.filename, currentDoc.currentSection);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [view]); // Re-run when view changes to capture isPlaying state

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            RSVP Speed Reader
          </h1>
          <p className="text-muted-foreground">
            Read faster with precision.
          </p>
        </div>

        {/* View: Reading interface */}
        {view === 'reading' && (
          <div className="space-y-6">
            {/* Back to navigation button (PDF documents only) */}
            {useDocumentStore.getState().filename && (
              <Card>
                <CardContent className="pt-6">
                  <Button
                    onClick={handleBackToNavigation}
                    variant="secondary"
                    className="w-full"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Navigation
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* RSVP Display and Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left column: RSVP Display and Controls */}
              <div className="lg:col-span-2 space-y-6">
                <RSVPDisplay />
                <div className="flex justify-center">
                  <RSVPControls />
                </div>
              </div>

              {/* Right column: Settings */}
              <div>
                <SettingsPanel />
              </div>
            </div>
          </div>
        )}

        {/* View: Navigation (after PDF upload) */}
        {view === 'navigation' && (
          <div className="space-y-6">
            {/* Document info */}
            <Card>
              <CardHeader>
                <CardTitle>Document Loaded</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {useDocumentStore.getState().filename} • {useDocumentStore.getState().pageCount} pages
                </p>
              </CardContent>
            </Card>

            {/* Navigation options */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* TOC Navigation */}
              <TOCNavigation onSectionSelect={handleTOCSelect} />

              {/* Page Range Selector */}
              <div className="space-y-6">
                <PageRangeSelector
                  pageCount={useDocumentStore.getState().pageCount}
                  onRangeSelect={handleRangeSelect}
                />

                {/* Full document option */}
                <Card>
                  <CardHeader>
                    <CardTitle>Full Document</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={handleFullDocument} className="w-full">
                      Start Reading Full Document
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* View: Upload (default) */}
        {view === 'upload' && (
          <>
            {/* Main reading interface (with sample text) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left column: RSVP Display and Controls */}
              <div className="lg:col-span-2 space-y-6">
                <RSVPDisplay />
                <div className="flex justify-center">
                  <RSVPControls />
                </div>
              </div>

              {/* Right column: Settings */}
              <div>
                <SettingsPanel />
              </div>
            </div>

            {/* Input section: PDF upload and manual text */}
            <Card>
              <CardHeader>
                <CardTitle>Load Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* PDF upload section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Upload PDF</h3>

                  {/* Error display */}
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Loading state */}
                  {isExtracting ? (
                    <div className="space-y-2">
                      <Progress value={progress} />
                      <p className="text-sm text-muted-foreground text-center">
                        Extracting text... {Math.round(progress)}%
                      </p>
                    </div>
                  ) : (
                    <PDFUpload
                      onFileSelected={handlePDFUpload}
                    />
                  )}
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or paste text manually
                    </span>
                  </div>
                </div>

                {/* Manual text input section */}
                <div className="space-y-4">
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste your text here..."
                    className="min-h-[150px] font-mono text-sm"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleLoadText}>
                      Load Text
                    </Button>
                    <Button onClick={handleReset} variant="outline">
                      Reset to Sample
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main>
  );
}
