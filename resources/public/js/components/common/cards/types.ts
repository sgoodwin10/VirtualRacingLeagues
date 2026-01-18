import type { Component } from 'vue';

// Variant Types
export type AccentColor = 'cyan' | 'green' | 'orange' | 'purple';
export type ChangeDirection = 'positive' | 'negative' | 'neutral';
export type AlertType = 'info' | 'success' | 'warning' | 'error';
export type InfoBoxType = 'info' | 'success' | 'warning' | 'danger';

// Component Props Interfaces
export interface VrlCardProps {
  /**
   * Card title displayed in the header
   */
  title?: string;

  /**
   * Whether the card should have hover effect
   * @default false
   */
  hoverable?: boolean;

  /**
   * Whether to show the card header
   * @default true if title is provided
   */
  showHeader?: boolean;

  /**
   * Whether to apply default padding to the card body
   * @default true
   */
  bodyPadding?: boolean;

  /**
   * Additional CSS classes for the card container
   */
  class?: string;
}

export interface VrlCardHeaderProps {
  /**
   * Header title text
   */
  title?: string;

  /**
   * Additional CSS classes for the header
   */
  class?: string;
}

export interface VrlCardBodyProps {
  /**
   * Remove default padding from the card body
   * Useful for tables or custom layouts
   * @default false
   */
  noPadding?: boolean;

  /**
   * Additional CSS classes for the body
   */
  class?: string;
}

export interface VrlCardFooterProps {
  /**
   * Additional CSS classes for the footer
   */
  class?: string;
}

export interface VrlFeatureCardProps {
  /**
   * Icon component (Phosphor Icons)
   */
  icon?: Component;

  /**
   * Icon as emoji or text
   */
  iconText?: string;

  /**
   * Card title
   */
  title: string;

  /**
   * Card description
   */
  description: string;

  /**
   * Additional CSS classes for the card
   */
  class?: string;
}

export interface VrlMetricCardProps {
  /**
   * Metric label (e.g., "Active Drivers")
   */
  label: string;

  /**
   * Metric value (e.g., "247", "1,842")
   */
  value: string | number;

  /**
   * Change indicator text (e.g., "↑ 12% from last month")
   */
  change?: string;

  /**
   * Icon component (Phosphor Icons)
   */
  icon?: Component;

  /**
   * Accent color for left stripe
   * @default 'cyan'
   */
  accentColor?: AccentColor;

  /**
   * Change direction affects color
   * @default 'neutral'
   */
  changeDirection?: ChangeDirection;

  /**
   * Additional CSS classes for the card
   */
  class?: string;
}

export interface VrlAlertProps {
  /**
   * Alert type affects color and icon
   * @default 'info'
   */
  type?: AlertType;

  /**
   * Alert title
   */
  title: string;

  /**
   * Alert message/description
   */
  message?: string;

  /**
   * Whether the alert can be dismissed
   * @default false
   */
  dismissible?: boolean;

  /**
   * Custom icon component (Phosphor Icons)
   * If not provided, default icon for type will be used
   */
  icon?: Component;

  /**
   * Additional CSS classes for the alert
   */
  class?: string;
}

export interface VrlAlertEmits {
  /**
   * Emitted when the alert is dismissed
   */
  (e: 'dismiss'): void;
}

export interface VrlInfoBoxProps {
  /**
   * Info box type affects left border color
   * @default 'info'
   */
  type?: InfoBoxType;

  /**
   * Info box title (e.g., "Tip", "Important")
   */
  title: string;

  /**
   * Info box message/content
   */
  message?: string;

  /**
   * Additional CSS classes for the info box
   */
  class?: string;
}
