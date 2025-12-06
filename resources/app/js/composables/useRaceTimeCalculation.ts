import { computed, type Ref } from 'vue';
import type { RaceResultFormData } from '@app/types/raceResult';

// Time regex pattern: hh:mm:ss.ms (ms can be 1-3 digits)
// Also allows +hh:mm:ss.ms for differences
const TIME_PATTERN = /^[+]?(\d{1,2}):(\d{2}):(\d{2})\.(\d{1,3})$/;

// Flexible input patterns
const FLEXIBLE_PATTERNS = {
  // Full format: hh:mm:ss.ms or h:mm:ss.ms
  full: /^([+]?)(\d{1,2}):(\d{2}):(\d{2})\.(\d{1,3})$/,
  // Minutes:seconds.ms: mm:ss.ms or m:ss.ms
  minutes: /^([+]?)(\d{1,2}):(\d{2})\.(\d{1,3})$/,
  // Seconds.ms: ss.ms or s.ms
  seconds: /^([+]?)(\d{1,2})\.(\d{1,3})$/,
};

export function useRaceTimeCalculation() {
  /**
   * Normalize flexible time input to full format hh:mm:ss.ms
   * Accepts:
   * - Full: "hh:mm:ss.ms" → "hh:mm:ss.ms" (padded)
   * - Minutes: "mm:ss.ms" → "00:mm:ss.ms"
   * - Seconds: "ss.ms" → "00:00:ss.ms"
   * - Supports + prefix for differences
   * - Returns empty string for empty input
   */
  function normalizeTimeInput(value: string | null | undefined): string {
    if (!value || value.trim() === '') return '';

    // Trim and remove all whitespace (handles cases like "+ 14.16" -> "+14.16")
    const trimmed = value.trim().replace(/\s+/g, '');

    // Try full format first
    const fullMatch = trimmed.match(FLEXIBLE_PATTERNS.full);
    if (fullMatch) {
      const prefix = fullMatch[1] ?? '';
      const hours = (fullMatch[2] ?? '0').padStart(2, '0');
      const minutes = fullMatch[3] ?? '00';
      const seconds = fullMatch[4] ?? '00';
      const ms = (fullMatch[5] ?? '0').padEnd(3, '0');
      return `${prefix}${hours}:${minutes}:${seconds}.${ms}`;
    }

    // Try minutes:seconds.ms format
    const minutesMatch = trimmed.match(FLEXIBLE_PATTERNS.minutes);
    if (minutesMatch) {
      const prefix = minutesMatch[1] ?? '';
      const minutes = (minutesMatch[2] ?? '0').padStart(2, '0');
      const seconds = minutesMatch[3] ?? '00';
      const ms = (minutesMatch[4] ?? '0').padEnd(3, '0');
      return `${prefix}00:${minutes}:${seconds}.${ms}`;
    }

    // Try seconds.ms format
    const secondsMatch = trimmed.match(FLEXIBLE_PATTERNS.seconds);
    if (secondsMatch) {
      const prefix = secondsMatch[1] ?? '';
      const seconds = (secondsMatch[2] ?? '0').padStart(2, '0');
      const ms = (secondsMatch[3] ?? '0').padEnd(3, '0');
      return `${prefix}00:00:${seconds}.${ms}`;
    }

    // If no pattern matches, return original (will fail validation)
    return trimmed;
  }

  /**
   * Validate time format
   */
  function isValidTimeFormat(value: string | null | undefined): boolean {
    if (!value || value.trim() === '') return true; // Empty is valid (optional)
    return TIME_PATTERN.test(value);
  }

  /**
   * Parse time string to milliseconds
   */
  function parseTimeToMs(value: string | null | undefined): number | null {
    if (!value || value.trim() === '') return null;

    const match = value.match(TIME_PATTERN);
    if (!match) return null;

    const hours = parseInt(match[1] ?? '0', 10);
    const minutes = parseInt(match[2] ?? '0', 10);
    const seconds = parseInt(match[3] ?? '0', 10);
    // Pad milliseconds to 3 digits for consistent calculation
    const msStr = (match[4] ?? '0').padEnd(3, '0');
    const milliseconds = parseInt(msStr, 10);

    return hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;
  }

  /**
   * Format milliseconds to time string hh:mm:ss.ms
   */
  function formatMsToTime(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    let remaining = ms - hours * 3600000;

    const minutes = Math.floor(remaining / 60000);
    remaining -= minutes * 60000;

    const seconds = Math.floor(remaining / 1000);
    const milliseconds = remaining - seconds * 1000;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
  }

  /**
   * Calculate race_time from original_race_time_difference and leader's time
   */
  function calculateRaceTimeFromDifference(
    leaderTimeMs: number | null,
    differenceMs: number | null,
  ): string | null {
    if (leaderTimeMs === null || differenceMs === null) return null;
    const totalMs = leaderTimeMs + differenceMs;
    return formatMsToTime(totalMs);
  }

  /**
   * Calculate effective time (race_time + penalties) for sorting
   */
  function calculateEffectiveTime(
    raceTimeMs: number | null,
    penaltiesMs: number | null,
  ): number | null {
    if (raceTimeMs === null) return null;
    return raceTimeMs + (penaltiesMs ?? 0);
  }

  /**
   * Sort results by effective time (ascending)
   * For qualifying, sort by fastest_lap
   */
  function sortResultsByTime(
    results: RaceResultFormData[],
    isQualifying: boolean,
  ): RaceResultFormData[] {
    return [...results].sort((a, b) => {
      if (isQualifying) {
        const timeA = parseTimeToMs(a.fastest_lap);
        const timeB = parseTimeToMs(b.fastest_lap);
        if (timeA === null && timeB === null) return 0;
        if (timeA === null) return 1;
        if (timeB === null) return -1;
        return timeA - timeB;
      } else {
        const effectiveA = calculateEffectiveTime(
          parseTimeToMs(a.original_race_time),
          parseTimeToMs(a.penalties),
        );
        const effectiveB = calculateEffectiveTime(
          parseTimeToMs(b.original_race_time),
          parseTimeToMs(b.penalties),
        );
        if (effectiveA === null && effectiveB === null) return 0;
        if (effectiveA === null) return 1;
        if (effectiveB === null) return -1;
        return effectiveA - effectiveB;
      }
    });
  }

  /**
   * Calculate positions based on sorted results
   * Returns results with position field populated
   */
  function calculatePositions(
    results: RaceResultFormData[],
    isQualifying: boolean,
  ): RaceResultFormData[] {
    const sorted = sortResultsByTime(results, isQualifying);
    return sorted.map((result, index) => ({
      ...result,
      position: result.driver_id ? index + 1 : null,
    }));
  }

  /**
   * Find the leader (fastest) in a set of results
   */
  function findLeaderTime(results: RaceResultFormData[], isQualifying: boolean): number | null {
    let minTime: number | null = null;

    for (const result of results) {
      if (!result.driver_id) continue;

      const timeMs = isQualifying
        ? parseTimeToMs(result.fastest_lap)
        : parseTimeToMs(result.original_race_time);

      if (timeMs !== null && (minTime === null || timeMs < minTime)) {
        minTime = timeMs;
      }
    }

    return minTime;
  }

  /**
   * Reactive calculation: Update original_race_time when original_race_time_difference changes
   * This is used for real-time recalculation in the form
   */
  function createReactiveTimeCalculation(
    results: Ref<RaceResultFormData[]>,
    isQualifying: Ref<boolean>,
  ) {
    // Find leader's race time in real-time
    const leaderTimeMs = computed(() => {
      if (isQualifying.value) return null;
      return findLeaderTime(results.value, false);
    });

    // Recalculate original_race_time for results that only have difference
    function recalculateFromDifferences(): void {
      if (isQualifying.value || leaderTimeMs.value === null) return;

      for (const result of results.value) {
        // Only recalculate if we have difference but no original_race_time
        // OR if original_race_time should be derived from difference
        const diffMs = parseTimeToMs(result.original_race_time_difference);

        if (diffMs !== null && result.original_race_time_difference) {
          const calculatedTime = calculateRaceTimeFromDifference(leaderTimeMs.value, diffMs);
          if (calculatedTime) {
            result.original_race_time = calculatedTime;
          }
        }
      }
    }

    return {
      leaderTimeMs,
      recalculateFromDifferences,
    };
  }

  return {
    normalizeTimeInput,
    isValidTimeFormat,
    parseTimeToMs,
    formatMsToTime,
    calculateRaceTimeFromDifference,
    calculateEffectiveTime,
    sortResultsByTime,
    calculatePositions,
    findLeaderTime,
    createReactiveTimeCalculation,
  };
}

// Export singleton pattern for simple use
export const raceTimeCalculation = useRaceTimeCalculation();
