/**
 * List Component Types
 *
 * TypeScript interfaces for the VRL Velocity Design System list components.
 */

/**
 * Status types for list row indicators
 */
export type VrlIndicatorStatus = 'active' | 'pending' | 'inactive';

/**
 * Color variants for stat values
 */
export type VrlStatColor = 'cyan' | 'orange' | 'green' | 'red' | 'purple';

/**
 * Props for VrlListContainer component
 */
export interface VrlListContainerProps {
  /**
   * Gap between list items
   * @default '0.5rem'
   */
  gap?: string | number;

  /**
   * Additional CSS classes for the container
   */
  class?: string;

  /**
   * ARIA label for the list
   */
  ariaLabel?: string;
}

/**
 * Props for VrlListSectionHeader component
 */
export interface VrlListSectionHeaderProps {
  /**
   * Section title text (e.g., "Active Seasons", "Completed")
   */
  title?: string;

  /**
   * Additional CSS classes for the header
   */
  class?: string;
}

/**
 * Props for VrlListRow component
 */
export interface VrlListRowProps {
  /**
   * Status for the indicator bar
   * Determines indicator color
   */
  status?: VrlIndicatorStatus;

  /**
   * Whether the row is clickable
   * Adds cursor pointer and enables click events
   * @default false
   */
  clickable?: boolean;

  /**
   * Additional CSS classes
   */
  class?: string;

  /**
   * ARIA label for the row
   */
  ariaLabel?: string;
}

/**
 * Emits for VrlListRow component
 */
export interface VrlListRowEmits {
  /**
   * Emitted when the row is clicked (only if clickable=true)
   */
  (e: 'click', event: MouseEvent): void;
}

/**
 * Props for VrlListRowIndicator component
 */
export interface VrlListRowIndicatorProps {
  /**
   * Status type - determines color
   */
  status: VrlIndicatorStatus;

  /**
   * Height of the indicator bar
   * @default '40px'
   */
  height?: string | number;

  /**
   * Width of the indicator bar
   * @default '4px'
   */
  width?: string | number;

  /**
   * Additional CSS classes
   */
  class?: string;
}

/**
 * Props for VrlListRowContent component
 */
export interface VrlListRowContentProps {
  /**
   * Main title text
   */
  title: string;

  /**
   * Subtitle text (metadata, secondary info)
   */
  subtitle?: string;

  /**
   * Additional CSS classes
   */
  class?: string;
}

/**
 * Props for VrlListRowStats component
 */
export interface VrlListRowStatsProps {
  /**
   * Gap between individual stats
   * @default '1.5rem'
   */
  gap?: string | number;

  /**
   * Additional CSS classes
   */
  class?: string;
}

/**
 * Props for VrlListRowStat component
 */
export interface VrlListRowStatProps {
  /**
   * Stat value (numeric or text)
   */
  value: string | number;

  /**
   * Stat label (e.g., "Drivers", "Races", "Points")
   */
  label: string;

  /**
   * Color variant for the value
   * Applies color class to value
   * @default undefined
   */
  valueColor?: VrlStatColor;

  /**
   * Additional CSS classes
   */
  class?: string;
}

/**
 * Props for VrlListRowAction component
 */
export interface VrlListRowActionProps {
  /**
   * Additional CSS classes
   */
  class?: string;
}
