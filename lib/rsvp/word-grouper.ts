/**
 * Word grouping utility for RSVP display.
 *
 * v1 implementation: Fixed-size grouping (simple, predictable)
 * v2 enhancement: Smart grouping with punctuation detection (deferred to Phase 4)
 */

/**
 * Group words into fixed-size display chunks.
 *
 * @param text - Full text to group
 * @param wordsPerGroup - Number of words per group (1-5)
 * @returns Array of word groups
 *
 * @example
 * groupWords("The quick brown fox", 2)
 * // ["The quick", "brown fox"]
 *
 * groupWords("The quick brown fox", 1)
 * // ["The", "quick", "brown", "fox"]
 */
export function groupWords(text: string, wordsPerGroup: number): string[] {
  // Split on whitespace, filter empty strings
  const words = text.split(/\s+/).filter(Boolean);

  if (wordsPerGroup === 1) {
    return words; // No grouping needed
  }

  const groups: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerGroup) {
    const chunk = words.slice(i, i + wordsPerGroup);
    groups.push(chunk.join(' '));
  }

  return groups;
}
