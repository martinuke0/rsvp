/**
 * Optimal Recognition Point (ORP) calculator.
 *
 * CRITICAL: Eye movement research shows readers fixate at 30-40% from word start,
 * not at 50% (geometric center). This is foundational - users train eye fixation
 * patterns immediately, wrong ORP causes permanent eye strain.
 *
 * Based on eye movement research:
 * - ≤2 chars: 50% (center)
 * - 3-5 chars: 35% (slightly left of center)
 * - 6-9 chars: 33% (one-third)
 * - >9 chars: 30% (further left)
 */

/**
 * Calculate Optimal Recognition Point index for a word or word group.
 *
 * Based on eye movement research: readers fixate ~30-40% into a word
 * for optimal character recognition. This is NOT the geometric center.
 *
 * @param text - Word or word group to calculate ORP for
 * @returns Character index for center letter highlighting (0-based)
 */
export function calculateORP(text: string): number {
  // Remove leading/trailing punctuation for calculation
  const leadingPunctMatch = text.match(/^[^\w]+/);
  const leadingPunctLength = leadingPunctMatch ? leadingPunctMatch[0].length : 0;

  const cleanText = text.replace(/^[^\w]+|[^\w]+$/g, '');

  if (cleanText.length === 0) {
    // Edge case: only punctuation (e.g., "...")
    return Math.floor(text.length / 2);
  }

  // For word groups, calculate ORP of the FIRST word
  // Users should fixate on first word, peripheral vision catches others
  const words = cleanText.split(/\s+/);
  const firstWord = words[0];

  // ORP formula: 30-40% into word, weighted by length
  let orpRatio: number;

  if (firstWord.length <= 2) {
    // Very short words: center or slightly left
    orpRatio = 0.5;
  } else if (firstWord.length <= 5) {
    // Short words: 35% (slightly left of center)
    orpRatio = 0.35;
  } else if (firstWord.length <= 9) {
    // Medium words: 33% (one-third)
    orpRatio = 0.33;
  } else {
    // Long words: 30% (further left for easier scanning)
    orpRatio = 0.30;
  }

  const orpIndex = Math.floor(firstWord.length * orpRatio);

  // Add back leading punctuation offset
  return leadingPunctLength + orpIndex;
}

/**
 * Split text into three parts for rendering: prefix, center letter, suffix.
 *
 * This enables highlighting the center letter at the ORP position:
 * <span>{prefix}</span><span className="highlight">{center}</span><span>{suffix}</span>
 *
 * @param text - Word or word group
 * @returns Tuple of [before, centerLetter, after]
 */
export function splitAtORP(text: string): [string, string, string] {
  const orpIndex = calculateORP(text);

  if (orpIndex >= text.length) {
    // Edge case: ORP beyond text length
    return [text, '', ''];
  }

  const before = text.slice(0, orpIndex);
  const centerLetter = text[orpIndex];
  const after = text.slice(orpIndex + 1);

  return [before, centerLetter, after];
}
