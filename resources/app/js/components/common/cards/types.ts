// resources/app/js/components/common/cards/types.ts

import type { Component } from 'vue';

/**
 * Semantic variant types for cards and alerts
 * Maps to design system colors
 */
export type CardVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

/**
 * Metric card variant types
 * Each variant has a corresponding accent color
 */
export type MetricVariant = 'default' | 'green' | 'orange' | 'purple' | 'red';

/**
 * Info box variant types
 * Used for informational messages with left border accent
 */
export type InfoBoxVariant = 'info' | 'success' | 'warning' | 'danger';

/**
 * Alert variant types
 * Used for notification banners
 */
export type AlertVariant = 'success' | 'warning' | 'error' | 'info';

/**
 * Change direction for metric cards
 * Indicates positive or negative change
 */
export type ChangeDirection = 'positive' | 'negative' | 'neutral';

/**
 * Props for the Card component
 */
export interface CardProps {
  /**
   * Card title displayed in the header
   * If not provided, header slot should be used
   */
  title?: string;

  /**
   * Whether to show the card header
   * @default true if title is provided
   */
  showHeader?: boolean;

  /**
   * Additional CSS classes for the card container
   */
  class?: string;
}

/**
 * Props for the CardHeader component
 */
export interface CardHeaderProps {
  /**
   * Header title text
   */
  title?: string;

  /**
   * Optional description text shown below the title
   */
  description?: string;

  /**
   * Icon component to display (Phosphor Icons)
   */
  icon?: Component;

  /**
   * Gradient start color for icon background (Tailwind class)
   * @example 'yellow-50', 'blue-50', 'green-50'
   */
  gradientFrom?: string;

  /**
   * Gradient end color for icon background (Tailwind class)
   * @example 'amber-50', 'cyan-50', 'teal-50'
   */
  gradientTo?: string;

  /**
   * Icon color (Tailwind class)
   * @example 'yellow-600', 'blue-600', 'green-600'
   */
  iconColor?: string;

  /**
   * Additional CSS classes for the header
   */
  class?: string;
}

/**
 * Props for the CardBody component
 */
export interface CardBodyProps {
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

/**
 * Props for the MetricCard component
 */
export interface MetricCardProps {
  /**
   * Metric label (e.g., "Drivers", "Teams", "Points")
   */
  label: string;

  /**
   * Metric value (e.g., "20", "5,420", "14/22")
   */
  value: string | number;

  /**
   * Optional change indicator text (e.g., "+2 active", "63.6% complete")
   */
  change?: string;

  /**
   * Change direction affects the icon and color
   * @default 'neutral'
   */
  changeDirection?: ChangeDirection;

  /**
   * Icon component to display (Phosphor Icons)
   */
  icon?: Component;

  /**
   * Visual variant of the metric card
   * Affects the top accent bar color
   * @default 'default'
   */
  variant?: MetricVariant;

  /**
   * Additional CSS classes for the card
   */
  class?: string;
}

/**
 * Props for the InfoBox component
 */
export interface InfoBoxProps {
  /**
   * Info box title (e.g., "INFORMATION", "SUCCESS")
   */
  title: string;

  /**
   * Info box message/text content
   */
  message?: string;

  /**
   * Visual variant of the info box
   * Affects the left border accent color
   * @default 'info'
   */
  variant?: InfoBoxVariant;

  /**
   * Additional CSS classes for the info box
   */
  class?: string;
}

/**
 * Props for the Alert component
 */
export interface AlertProps {
  /**
   * Alert title
   */
  title: string;

  /**
   * Alert message/description
   */
  message: string;

  /**
   * Visual variant of the alert
   * Affects background color, border, and icon
   * @default 'info'
   */
  variant?: AlertVariant;

  /**
   * Custom icon component (Phosphor Icons)
   * If not provided, default icon for variant will be used
   */
  icon?: Component;

  /**
   * Whether the alert can be dismissed
   * @default false
   */
  dismissible?: boolean;

  /**
   * Additional CSS classes for the alert
   */
  class?: string;
}

/**
 * Emits for the Alert component
 */
export interface AlertEmits {
  /**
   * Emitted when the alert is dismissed
   */
  (e: 'dismiss'): void;
}

/**
 * Props for the NoteBox component
 */
export interface NoteBoxProps {
  /**
   * Note box title (e.g., "USAGE GUIDELINES", "IMPORTANT")
   */
  title: string;

  /**
   * Additional CSS classes for the note box
   */
  class?: string;
}
