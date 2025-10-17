import type { AdminStatus } from '@admin/types/admin';
import type { UserStatus } from '@admin/types/user';

/**
 * Union type for all status types (Admin and User share the same statuses)
 */
export type Status = AdminStatus | UserStatus;

/**
 * Badge variant type for status display
 */
export type StatusBadgeVariant = 'success' | 'secondary' | 'danger';

/**
 * Composable for handling status-related operations
 * Works with both Admin and User status types
 *
 * @example
 * ```typescript
 * const { getStatusLabel, getStatusVariant, getStatusIcon } = useStatusHelpers();
 *
 * const label = getStatusLabel('active'); // 'Active'
 * const variant = getStatusVariant('suspended'); // 'danger'
 * const icon = getStatusIcon('inactive'); // 'pi-circle'
 * ```
 */
export function useStatusHelpers() {
  /**
   * Get the display label for a status
   *
   * @param status - The status value
   * @returns The human-readable label
   */
  const getStatusLabel = (status: Status): string => {
    const labels: Record<Status, string> = {
      active: 'Active',
      inactive: 'Inactive',
      suspended: 'Suspended',
    };
    return labels[status] || status;
  };

  /**
   * Get the badge variant for a status (for UI styling)
   *
   * @param status - The status value
   * @returns The variant string for badge styling
   */
  const getStatusVariant = (status: Status): StatusBadgeVariant => {
    const variants: Record<Status, StatusBadgeVariant> = {
      active: 'success',
      inactive: 'secondary',
      suspended: 'danger',
    };
    return variants[status] || 'secondary';
  };

  /**
   * Get the icon class for a status
   *
   * @param status - The status value
   * @returns The PrimeIcons class name
   */
  const getStatusIcon = (status: Status): string => {
    const icons: Record<Status, string> = {
      active: 'pi-circle-fill',
      inactive: 'pi-circle',
      suspended: 'pi-ban',
    };
    return icons[status] || 'pi-circle';
  };

  /**
   * Check if a status is active
   *
   * @param status - The status value
   * @returns True if status is 'active'
   */
  const isActive = (status: Status): boolean => {
    return status === 'active';
  };

  /**
   * Check if a status is inactive
   *
   * @param status - The status value
   * @returns True if status is 'inactive'
   */
  const isInactive = (status: Status): boolean => {
    return status === 'inactive';
  };

  /**
   * Check if a status is suspended
   *
   * @param status - The status value
   * @returns True if status is 'suspended'
   */
  const isSuspended = (status: Status): boolean => {
    return status === 'suspended';
  };

  return {
    getStatusLabel,
    getStatusVariant,
    getStatusIcon,
    isActive,
    isInactive,
    isSuspended,
  };
}
