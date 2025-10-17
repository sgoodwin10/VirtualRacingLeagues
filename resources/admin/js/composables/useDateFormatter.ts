import { format, isValid, parseISO, formatDistanceToNow } from 'date-fns';

/**
 * Composable for formatting dates throughout the admin dashboard
 *
 * @returns Object containing the formatDate and formatRelativeTime functions
 *
 * @example
 * ```typescript
 * const { formatDate, formatRelativeTime } = useDateFormatter();
 *
 * // Default format: "4:43pm 3rd Aug 25"
 * formatDate(dateString);
 *
 * // Custom format
 * formatDate(dateString, 'PPpp'); // or any date-fns format string
 *
 * // Relative time: "2 hours ago"
 * formatRelativeTime(dateString);
 * ```
 */
export function useDateFormatter() {
  /**
   * Format a date string for display
   *
   * @param dateString - The date string to format (ISO format or any valid date string)
   * @param formatString - Optional custom format string (date-fns format)
   * @returns Formatted date string, "Never" if null/empty, or "Invalid date" if invalid
   *
   * @example
   * ```typescript
   * formatDate('2025-08-03T16:43:00Z') // "4:43pm 3rd Aug 25"
   * formatDate('2025-08-03T16:43:00Z', 'PPpp') // "Aug 3rd, 2025 at 4:43 PM"
   * formatDate(null) // "Never"
   * formatDate('invalid') // "Invalid date"
   * ```
   */
  const formatDate = (
    dateString: string | null | undefined,
    formatString: string = 'h:mmaaa do MMM yy'
  ): string => {
    // Handle null, undefined, or empty strings
    if (!dateString) {
      return 'Never';
    }

    try {
      // Parse the date string
      const date = parseISO(dateString);

      // Check if the date is valid
      if (!isValid(date)) {
        return 'Invalid date';
      }

      // Format and return the date
      return format(date, formatString);
    } catch (error) {
      return 'Invalid date';
    }
  };

  /**
   * Format a date as relative time (e.g., "2 hours ago", "3 days ago")
   *
   * @param dateString - The date string to format (ISO format or any valid date string)
   * @returns Formatted relative time string, "Never" if null/empty, or "Invalid date" if invalid
   *
   * @example
   * ```typescript
   * formatRelativeTime('2025-08-03T16:43:00Z') // "2 hours ago"
   * formatRelativeTime(null) // "Never"
   * formatRelativeTime('invalid') // "Invalid date"
   * ```
   */
  const formatRelativeTime = (dateString: string | null | undefined): string => {
    // Handle null, undefined, or empty strings
    if (!dateString) {
      return 'Never';
    }

    try {
      // Parse the date string
      const date = parseISO(dateString);

      // Check if the date is valid
      if (!isValid(date)) {
        return 'Invalid date';
      }

      // Format and return the relative time
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  return {
    formatDate,
    formatRelativeTime,
  };
}
