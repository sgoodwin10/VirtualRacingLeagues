/**
 * VRL Velocity Design System - Component Type Definitions
 *
 * Shared TypeScript types for badge, indicator, and tag components
 */

/**
 * Color variants for badges
 */
export type BadgeVariant = 'default' | 'cyan' | 'green' | 'orange' | 'red' | 'purple';

/**
 * Color variants for tags (uses semantic naming)
 */
export type TagVariant = 'default' | 'cyan' | 'success' | 'warning' | 'danger';

/**
 * Status types for status indicators
 */
export type StatusType = 'active' | 'pending' | 'inactive' | 'error';

/**
 * Position type (positive integers)
 */
export type Position = number;

/**
 * Type guard to validate position is a positive integer
 *
 * @param position - Position number to validate
 * @returns True if position is a positive integer, false otherwise
 */
export function isValidPosition(position: number): boolean {
  return Number.isInteger(position) && position > 0;
}
