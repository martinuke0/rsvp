'use client';

import { useState, useEffect } from 'react';
import { RSVPDisplay } from '@/components/reader/RSVPDisplay';
import { RSVPControls } from '@/components/reader/RSVPControls';
import { SettingsPanel } from '@/components/reader/SettingsPanel';
import { useReadingStore } from '@/store/reading-store';
import { useSettingsStore } from '@/store/settings-store';
import { groupWords } from '@/lib/rsvp/word-grouper';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const SAMPLE_TEXT = `Rapid Serial Visual Presentation (RSVP) is a technique for displaying text in which words are presented one at a time at a specific location on the screen. This method eliminates eye movement and enables reading speeds of 300-1000 words per minute while maintaining comprehension. The key to effective RSVP is the Optimal Recognition Point (ORP), positioned at approximately 30-40% from the start of each word, which aligns with natural eye fixation patterns discovered through eye-tracking research.`;

export default function Home() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const initialize = useReadingStore((state) => state.initialize);
  const reset = useReadingStore((state) => state.reset);
  const wordsPerGroup = useSettingsStore((state) => state.wordsPerGroup);

  const handleLoadText = () => {
    if (text.trim()) {
      const grouped = groupWords(text, wordsPerGroup);
      initialize(grouped);
    }
  };

  const handleReset = () => {
    reset();
    setText(SAMPLE_TEXT);
  };

  // Auto-load sample text on mount
  useEffect(() => {
    handleLoadText();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

        {/* Text input section */}
        <Card>
          <CardHeader>
            <CardTitle>Load Text</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
