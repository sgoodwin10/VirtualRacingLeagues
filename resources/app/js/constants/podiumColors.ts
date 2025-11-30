/**
 * Shared podium color constants for styling table rows
 * Used across ResultDivisionTabs, CrossDivisionResultsSection, RaceEventResultsSection, and RoundStandingsSection
 */

export const PODIUM_COLORS = {
  FIRST: '!bg-amber-100', // Gold
  SECOND: '!bg-gray-200', // Silver
  THIRD: '!bg-orange-100', // Bronze
} as const;

/**
 * Get the appropriate row class based on position
 * @param position - The position/rank (1, 2, 3, etc.)
 * @returns The CSS class for the row, or empty string if not a podium position
 */
export function getPodiumRowClass(position: number | null | undefined): string {
  switch (position) {
    case 1:
      return PODIUM_COLORS.FIRST;
    case 2:
      return PODIUM_COLORS.SECOND;
    case 3:
      return PODIUM_COLORS.THIRD;
    default:
      return '';
  }
}
