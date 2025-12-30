/**
 * Technical Blueprint podium color constants
 * Used for position indicators and row highlighting in standings and results tables
 */

export const PODIUM_COLORS = {
  /** First place - Gold */
  FIRST: {
    text: '#d29922',
    background: 'rgba(210, 153, 34, 0.08)',
  },
  /** Second place - Silver */
  SECOND: {
    text: '#6e7681',
    background: 'rgba(110, 118, 129, 0.08)',
  },
  /** Third place - Bronze */
  THIRD: {
    text: '#f0883e',
    background: 'rgba(240, 136, 62, 0.08)',
  },
} as const;

export const PODIUM_ROW_CLASSES = {
  FIRST: 'podium-1',
  SECOND: 'podium-2',
  THIRD: 'podium-3',
} as const;

export const PODIUM_CELL_CLASSES = {
  FIRST: 'pos p1',
  SECOND: 'pos p2',
  THIRD: 'pos p3',
} as const;

export function getPodiumRowClass(position: number | null | undefined): string {
  switch (position) {
    case 1:
      return PODIUM_ROW_CLASSES.FIRST;
    case 2:
      return PODIUM_ROW_CLASSES.SECOND;
    case 3:
      return PODIUM_ROW_CLASSES.THIRD;
    default:
      return '';
  }
}

export function getPodiumCellClass(position: number | null | undefined): string {
  switch (position) {
    case 1:
      return PODIUM_CELL_CLASSES.FIRST;
    case 2:
      return PODIUM_CELL_CLASSES.SECOND;
    case 3:
      return PODIUM_CELL_CLASSES.THIRD;
    default:
      return 'pos';
  }
}

export function getPodiumTextColor(position: number | null | undefined): string | null {
  switch (position) {
    case 1:
      return PODIUM_COLORS.FIRST.text;
    case 2:
      return PODIUM_COLORS.SECOND.text;
    case 3:
      return PODIUM_COLORS.THIRD.text;
    default:
      return null;
  }
}

export function getPodiumBackgroundColor(position: number | null | undefined): string | null {
  switch (position) {
    case 1:
      return PODIUM_COLORS.FIRST.background;
    case 2:
      return PODIUM_COLORS.SECOND.background;
    case 3:
      return PODIUM_COLORS.THIRD.background;
    default:
      return null;
  }
}
