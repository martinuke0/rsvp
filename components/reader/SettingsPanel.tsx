'use client';

import { useSettingsStore } from '@/store/settings-store';
import { useDebounce } from 'use-debounce';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * Settings Panel Component.
 *
 * Provides WPM and word grouping controls with live value display.
 *
 * Key patterns:
 * - Selective subscriptions for performance
 * - Debounced updates prevent excessive store changes during drag
 * - Live value display above each slider
 * - Guidance text for user expectations
 * - Card layout matches Phase 01-01 aesthetic
 */
export function SettingsPanel() {
  const wpm = useSettingsStore((state) => state.wpm);
  const wordsPerGroup = useSettingsStore((state) => state.wordsPerGroup);
  const setWPM = useSettingsStore((state) => state.setWPM);
  const setWordsPerGroup = useSettingsStore((state) => state.setWordsPerGroup);

  // Debounce WPM changes to prevent excessive store updates during drag
  const [debouncedWPM] = useDebounce(wpm, 100);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Reading Settings</CardTitle>
        <CardDescription>
          Customize your reading experience
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* WPM Control */}
        <div className="space-y-2">
          <div className="flex justify-between items-center gap-2">
            <Label htmlFor="wpm-slider">Reading Speed</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={100}
                max={1000}
                step={50}
                value={wpm}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 100 && value <= 1000) {
                    setWPM(value);
                  }
                }}
                onFocus={(e) => e.target.select()}
                className="w-20 h-8 text-sm text-right"
              />
              <span className="text-sm text-muted-foreground">WPM</span>
            </div>
          </div>
          <Slider
            id="wpm-slider"
            min={100}
            max={1000}
            step={50}
            value={[wpm]}
            onValueChange={([value]) => setWPM(value)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Recommended: 250-400 WPM for comfortable reading. Use ↑/↓ arrows to adjust.
          </p>
        </div>

        {/* Word Grouping Control */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="grouping-slider">Words Per Flash</Label>
            <span className="text-sm text-muted-foreground">
              {wordsPerGroup} {wordsPerGroup === 1 ? 'word' : 'words'}
            </span>
          </div>
          <Slider
            id="grouping-slider"
            min={1}
            max={5}
            step={1}
            value={[wordsPerGroup]}
            onValueChange={([value]) => setWordsPerGroup(value)}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            More words = faster reading, but requires practice
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
