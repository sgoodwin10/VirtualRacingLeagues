import type { AdminRole } from '@admin/types/admin';

/**
 * Role hierarchy mapping
 * Higher numbers indicate higher privileges
 */
export const ROLE_HIERARCHY: Record<AdminRole, number> = {
  super_admin: 3,
  admin: 2,
  moderator: 1,
} as const;

/**
 * Composable for handling admin role-related operations
 *
 * @example
 * ```typescript
 * const { getRoleLevel, hasRoleAccess, getRoleLabel } = useRoleHelpers();
 *
 * const level = getRoleLevel('admin'); // 2
 * const hasAccess = hasRoleAccess('admin', 'moderator'); // true
 * const label = getRoleLabel('super_admin'); // 'Super Admin'
 * ```
 */
export function useRoleHelpers() {
  /**
   * Get the hierarchical level of a role
   *
   * @param role - The admin role to check
   * @returns The numeric level of the role (0 if invalid)
   */
  const getRoleLevel = (role: AdminRole | null): number => {
    if (!role) return 0;
    return ROLE_HIERARCHY[role] || 0;
  };

  /**
   * Check if a role has access to perform actions requiring a minimum role level
   *
   * @param currentRole - The role to check access for
   * @param requiredRole - The minimum required role
   * @returns True if currentRole has sufficient privileges
   */
  const hasRoleAccess = (currentRole: AdminRole | null, requiredRole: AdminRole): boolean => {
    const currentLevel = getRoleLevel(currentRole);
    const requiredLevel = getRoleLevel(requiredRole);
    return currentLevel >= requiredLevel;
  };

  /**
   * Get the display label for a role
   *
   * @param role - The admin role
   * @returns The human-readable label
   */
  const getRoleLabel = (role: AdminRole): string => {
    const labels: Record<AdminRole, string> = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      moderator: 'Moderator',
    };
    return labels[role] || 'Unknown';
  };

  /**
   * Get the badge variant for a role (for UI styling)
   *
   * @param role - The admin role
   * @returns The variant string for badge styling
   */
  const getRoleBadgeVariant = (role: AdminRole): 'danger' | 'warning' | 'info' => {
    const variants: Record<AdminRole, 'danger' | 'warning' | 'info'> = {
      super_admin: 'danger',
      admin: 'warning',
      moderator: 'info',
    };
    return variants[role] || 'info';
  };

  return {
    getRoleLevel,
    hasRoleAccess,
    getRoleLabel,
    getRoleBadgeVariant,
  };
}
