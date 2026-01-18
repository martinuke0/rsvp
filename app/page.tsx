'use client';

import { useState, useEffect, useCallback } from 'react';
import { RSVPDisplay } from '@/components/reader/RSVPDisplay';
import { RSVPControls } from '@/components/reader/RSVPControls';
import { SettingsPanel } from '@/components/reader/SettingsPanel';
import PDFUpload from '@/components/pdf/PDFUpload';
import { useReadingStore } from '@/store/reading-store';
import { useSettingsStore } from '@/store/settings-store';
import { useDocumentStore } from '@/store/document-store';
import { usePDFExtraction } from '@/hooks/use-pdf-extraction';
import { groupWords } from '@/lib/rsvp/word-grouper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertCircle } from 'lucide-react';

const SAMPLE_TEXT = `Rapid Serial Visual Presentation (RSVP) is a technique for displaying text in which words are presented one at a time at a specific location on the screen. This method eliminates eye movement and enables reading speeds of 300-1000 words per minute while maintaining comprehension. The key to effective RSVP is the Optimal Recognition Point (ORP), positioned at approximately 30-40% from the start of each word, which aligns with natural eye fixation patterns discovered through eye-tracking research.`;

export default function Home() {
  const [text, setText] = useState(SAMPLE_TEXT);
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
   * Stores document data and initializes RSVP reading
   */
  const handlePDFUpload = useCallback(async (file: File) => {
    await extractPDF(file, wordsPerGroup);
  }, [extractPDF, wordsPerGroup]);

  // Auto-load sample text on mount
  useEffect(() => {
    handleLoadText();
  }, [handleLoadText]);

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            RSVP Speed Reader
          </h1>
          <p className="text-muted-foreground">
            Read faster with precision focal point guidance
          </p>
        </div>

        {/* Main reading interface */}
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
      </div>
    </main>
  );
}
