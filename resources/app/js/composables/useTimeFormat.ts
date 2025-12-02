/**
 * Composable for formatting race times
 *
 * Removes leading zeros and their colons from time strings to display cleaner times.
 *
 * @returns Object containing the formatRaceTime function
 *
 * @example
 * ```typescript
 * const { formatRaceTime } = useTimeFormat();
 *
 * formatRaceTime('00:02:23.342'); // "2:23.342"
 * formatRaceTime('00:00:45.123'); // "45.123"
 * formatRaceTime('01:02:03.456'); // "1:02:03.456"
 * formatRaceTime('00:12:34.567'); // "12:34.567"
 * formatRaceTime(null); // "-"
 * formatRaceTime(''); // "-"
 * ```
 */
export function useTimeFormat() {
  /**
   * Format race time by removing leading zeros and their colons
   *
   * @param timeString - The time string to format (format: hh:mm:ss.ms or +hh:mm:ss.ms)
   * @returns Formatted time string with leading zeros removed, or "-" if null/empty
   *
   * @example
   * ```typescript
   * formatRaceTime('00:02:23.342'); // "2:23.342"
   * formatRaceTime('00:00:45.123'); // "45.123"
   * formatRaceTime('01:02:03.456'); // "1:02:03.456"
   * formatRaceTime('00:12:34.567'); // "12:34.567"
   * formatRaceTime('+00:00:14.160'); // "+14.160"
   * formatRaceTime('+00:01:23.456'); // "+1:23.456"
   * formatRaceTime(null); // "-"
   * formatRaceTime(''); // "-"
   * formatRaceTime('invalid'); // "invalid" (returns as-is for non-matching strings)
   * ```
   */
  const formatRaceTime = (timeString: string | null | undefined): string => {
    // Handle null, undefined, or empty strings
    if (!timeString || timeString.trim() === '') {
      return '-';
    }

    // Match time pattern: [+]hh:mm:ss.ms
    const timePattern = /^([+]?)(\d{2}):(\d{2}):(\d{2})\.(\d{1,3})$/;
    const match = timeString.match(timePattern);

    // If doesn't match expected pattern, return as-is
    if (!match) {
      return timeString;
    }

    const prefix = match[1] || ''; // Optional + sign
    const hours = parseInt(match[2] ?? '0', 10);
    const minutes = parseInt(match[3] ?? '0', 10);
    const seconds = match[4] ?? '00';
    const milliseconds = match[5] ?? '0';

    // Build formatted string based on which parts are non-zero
    if (hours > 0) {
      // If hours exist, show h:mm:ss.ms
      return `${prefix}${hours}:${match[3]}:${seconds}.${milliseconds}`;
    } else if (minutes > 0) {
      // If only minutes exist, show m:ss.ms (remove leading zero from minutes)
      return `${prefix}${minutes}:${seconds}.${milliseconds}`;
    } else {
      // If only seconds, show ss.ms (keep seconds padding)
      return `${prefix}${seconds}.${milliseconds}`;
    }
  };

  return {
    formatRaceTime,
  };
}
