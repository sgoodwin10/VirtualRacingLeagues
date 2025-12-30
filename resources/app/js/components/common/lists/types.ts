/**
 * List Component Types
 *
 * TypeScript interfaces for the reusable list component system.
 */

export type IndicatorStatus = 'active' | 'upcoming' | 'completed' | 'pending' | 'inactive';

export interface ListSectionHeaderProps {
  title: string;
  class?: string;
}

export interface ListContainerProps {
  gap?: string | number; // default '12px'
  class?: string;
  ariaLabel?: string;
}

export interface ListRowIndicatorProps {
  status: IndicatorStatus;
  height?: string | number; // default '40px'
  width?: string | number; // default '4px'
  class?: string;
}

export interface ListRowStatProps {
  value: string | number;
  label: string;
  class?: string;
}

export interface ListRowStatsProps {
  gap?: string | number; // default '24px'
  class?: string;
}

export interface ListRowProps {
  status?: IndicatorStatus;
  showIndicator?: boolean; // default true if status provided
  clickable?: boolean; // default false
  noHover?: boolean; // default false
  class?: string;
  ariaLabel?: string;
}

export interface ListRowEmits {
  (e: 'click', event: MouseEvent): void;
}
