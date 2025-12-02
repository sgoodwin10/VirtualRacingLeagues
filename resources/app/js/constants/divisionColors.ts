/**
 * Division color constants for styling division tags
 * Light, pastel colors chosen for readability and visual harmony
 * Used in CrossDivisionResultsSection to color-code division tags
 */

/**
 * Array of 8 light background colors for division tags
 * Colors are chosen to be:
 * - Visually distinct from each other
 * - Light enough to maintain text readability
 * - Harmonious when viewed together
 * - Accessible with sufficient contrast
 */
export const DIVISION_TAG_COLORS = [
  '!bg-blue-200 !text-blue-800', // Division 1: Soft blue
  '!bg-green-200 !text-green-800', // Division 2: Mint green
  '!bg-purple-200 !text-purple-800', // Division 3: Lavender
  '!bg-pink-200 !text-pink-800', // Division 4: Pale pink
  '!bg-yellow-200 !text-yellow-800', // Division 5: Light yellow
  '!bg-cyan-200 !text-cyan-800', // Division 6: Soft cyan
  '!bg-rose-200 !text-rose-800', // Division 7: Soft rose
  '!bg-indigo-200 !text-indigo-800', // Division 8: Light indigo
] as const;

/**
 * Get the appropriate tag class based on division ID
 * Cycles through available colors for divisions beyond 8 using modulo
 * @param divisionId - The division ID (1+)
 * @returns The CSS classes for the tag background and text, or empty string if no division
 */
export function getDivisionTagClass(divisionId: number | null | undefined): string {
  if (!divisionId || divisionId < 1) {
    return '';
  }
  // Division IDs are 1-indexed, array is 0-indexed
  // Use modulo to cycle colors for divisions beyond 8
  const colorIndex = (divisionId - 1) % DIVISION_TAG_COLORS.length;
  const color = DIVISION_TAG_COLORS[colorIndex];
  return color ?? '';
}
