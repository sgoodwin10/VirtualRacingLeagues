/**
 * Composable for division tag styling
 *
 * Provides consistent division color mapping across components
 * that display division information (e.g., RaceResultsTable, TimeResultsTable).
 *
 * Note: Division styles are defined globally in resources/public/css/components/_division-tags.css
 * This composable only handles the logic for mapping division IDs to CSS class names.
 */

/**
 * Division color classes mapped by position in rotation
 */
const DIVISION_COLOR_CLASSES = [
  'division-blue',
  'division-green',
  'division-purple',
  'division-orange',
  'division-red',
  'division-cyan',
] as const;

/**
 * Composable for division styling utilities
 */
export function useDivisionStyles() {
  /**
   * Get the CSS class name for a division based on its ID
   *
   * @param divisionId - The division ID (typically 1-indexed from database)
   * @returns CSS class name for the division color
   *
   * @example
   * ```typescript
   * const { getDivisionClass } = useDivisionStyles();
   * const className = getDivisionClass(1); // Returns 'division-blue'
   * const className = getDivisionClass(2); // Returns 'division-green'
   * ```
   */
  const getDivisionClass = (divisionId?: number): string => {
    if (!divisionId) return 'division-default';

    // Cycle through different color classes based on division ID
    // Division IDs are 1-indexed, so subtract 1 for 0-indexed array
    const colorIndex = (divisionId - 1) % DIVISION_COLOR_CLASSES.length;

    return DIVISION_COLOR_CLASSES[colorIndex] || 'division-default';
  };

  return {
    getDivisionClass,
  };
}
