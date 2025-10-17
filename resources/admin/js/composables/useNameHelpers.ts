/**
 * Interface for objects with name properties
 */
export interface NamedEntity {
  name?: string;
  first_name?: string;
  last_name?: string;
}

/**
 * Composable for handling name-related operations
 * Works with Admin, User, or any object with name properties
 *
 * @example
 * ```typescript
 * const { getFullName, getFirstName, getLastName, getUserInitials } = useNameHelpers();
 *
 * const admin: Admin = { first_name: 'John', last_name: 'Doe', ... };
 * const fullName = getFullName(admin); // 'John Doe'
 * const initials = getUserInitials(admin); // 'JD'
 * ```
 */
export function useNameHelpers() {
  /**
   * Get the full name from an entity
   * Prefers the 'name' field if available, otherwise combines first_name and last_name
   *
   * @param entity - The entity with name properties
   * @returns The full name, or 'Unknown' if no name is available
   */
  const getFullName = (entity: NamedEntity): string => {
    // If a 'name' field exists and is populated, use it directly
    if (entity.name && entity.name.trim()) {
      return entity.name.trim();
    }

    // Otherwise, construct from first_name and last_name
    const firstName = entity.first_name?.trim() || '';
    const lastName = entity.last_name?.trim() || '';

    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }

    if (firstName) {
      return firstName;
    }

    if (lastName) {
      return lastName;
    }

    return 'Unknown';
  };

  /**
   * Get the first name from an entity
   * Attempts to extract from 'first_name' field, or from 'name' field
   *
   * @param entity - The entity with name properties
   * @returns The first name, or empty string if not available
   */
  const getFirstName = (entity: NamedEntity): string => {
    // If first_name is available, use it
    if (entity.first_name) {
      return entity.first_name.trim();
    }

    // Otherwise, try to extract from the 'name' field
    if (entity.name) {
      const parts = entity.name.trim().split(' ');
      return parts[0] || '';
    }

    return '';
  };

  /**
   * Get the last name from an entity
   * Attempts to extract from 'last_name' field, or from 'name' field
   *
   * @param entity - The entity with name properties
   * @returns The last name, or empty string if not available
   */
  const getLastName = (entity: NamedEntity): string => {
    // If last_name is available, use it
    if (entity.last_name) {
      return entity.last_name.trim();
    }

    // Otherwise, try to extract from the 'name' field
    if (entity.name) {
      const parts = entity.name.trim().split(' ');
      // Everything after the first part is considered the last name
      return parts.slice(1).join(' ') || '';
    }

    return '';
  };

  /**
   * Get user initials for avatar display
   * Creates 1-2 letter initials from the user's name
   *
   * @param entity - The entity with name properties
   * @returns The initials (e.g., 'JD' for John Doe), or 'U' as fallback
   */
  const getUserInitials = (entity: NamedEntity): string => {
    const firstName = getFirstName(entity);
    const lastName = getLastName(entity);

    // Try to get initials from first and last name
    if (firstName && lastName) {
      return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    }

    // If only first name is available
    if (firstName) {
      // If first name has multiple words, use first letters of first two words
      const parts = firstName.split(' ');
      if (parts.length >= 2 && parts[0] && parts[1]) {
        return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
      }
      // Otherwise, use first letter only
      return firstName.charAt(0).toUpperCase();
    }

    // If only last name is available
    if (lastName) {
      return lastName.charAt(0).toUpperCase();
    }

    // Fallback to 'U' for Unknown
    return 'U';
  };

  /**
   * Get display name with fallback to email
   * Useful when you want to show something even if name is missing
   *
   * @param entity - The entity with name and optional email
   * @param email - Optional email to use as fallback
   * @returns The name or email
   */
  const getDisplayName = (entity: NamedEntity, email?: string): string => {
    const fullName = getFullName(entity);
    if (fullName !== 'Unknown') {
      return fullName;
    }
    return email || 'Unknown User';
  };

  /**
   * Check if an entity has a complete name (both first and last)
   *
   * @param entity - The entity to check
   * @returns True if both first and last name are available
   */
  const hasCompleteName = (entity: NamedEntity): boolean => {
    return (
      !!(entity.first_name && entity.last_name) || !!(entity.name && entity.name.includes(' '))
    );
  };

  return {
    getFullName,
    getFirstName,
    getLastName,
    getUserInitials,
    getDisplayName,
    hasCompleteName,
  };
}
