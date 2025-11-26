import { describe, it, expect } from 'vitest';
import { useRaceTimeCalculation } from '../useRaceTimeCalculation';

describe('useRaceTimeCalculation', () => {
  const {
    normalizeTimeInput,
    isValidTimeFormat,
    parseTimeToMs,
    formatMsToTime,
    calculateRaceTimeFromDifference,
  } = useRaceTimeCalculation();

  describe('normalizeTimeInput', () => {
    it('normalizes full format (hh:mm:ss.ms) with padding', () => {
      expect(normalizeTimeInput('1:23:45.678')).toBe('01:23:45.678');
      expect(normalizeTimeInput('01:23:45.678')).toBe('01:23:45.678');
      expect(normalizeTimeInput('1:02:03.4')).toBe('01:02:03.400');
      expect(normalizeTimeInput('12:34:56.12')).toBe('12:34:56.120');
    });

    it('normalizes minutes:seconds.ms format to 00:mm:ss.ms', () => {
      expect(normalizeTimeInput('1:23.456')).toBe('00:01:23.456');
      expect(normalizeTimeInput('12:34.567')).toBe('00:12:34.567');
      expect(normalizeTimeInput('1:02.3')).toBe('00:01:02.300');
      expect(normalizeTimeInput('59:59.999')).toBe('00:59:59.999');
    });

    it('normalizes seconds.ms format to 00:00:ss.ms', () => {
      expect(normalizeTimeInput('23.456')).toBe('00:00:23.456');
      expect(normalizeTimeInput('5.234')).toBe('00:00:05.234');
      expect(normalizeTimeInput('1.2')).toBe('00:00:01.200');
      expect(normalizeTimeInput('45.1')).toBe('00:00:45.100');
    });

    it('handles + prefix for time differences', () => {
      expect(normalizeTimeInput('+1:23:45.678')).toBe('+01:23:45.678');
      expect(normalizeTimeInput('+1:23.456')).toBe('+00:01:23.456');
      expect(normalizeTimeInput('+5.234')).toBe('+00:00:05.234');
    });

    it('returns empty string for empty/null input', () => {
      expect(normalizeTimeInput('')).toBe('');
      expect(normalizeTimeInput('   ')).toBe('');
      expect(normalizeTimeInput(null)).toBe('');
      expect(normalizeTimeInput(undefined)).toBe('');
    });

    it('pads milliseconds to 3 digits', () => {
      expect(normalizeTimeInput('1:23:45.1')).toBe('01:23:45.100');
      expect(normalizeTimeInput('1:23.1')).toBe('00:01:23.100');
      expect(normalizeTimeInput('23.1')).toBe('00:00:23.100');
    });

    it('handles edge cases', () => {
      expect(normalizeTimeInput('0:00:00.000')).toBe('00:00:00.000');
      expect(normalizeTimeInput('0:00.000')).toBe('00:00:00.000');
      expect(normalizeTimeInput('0.000')).toBe('00:00:00.000');
    });

    it('returns original value for invalid formats', () => {
      expect(normalizeTimeInput('invalid')).toBe('invalid');
      expect(normalizeTimeInput('12:34')).toBe('12:34');
      expect(normalizeTimeInput('abc:def.ghi')).toBe('abc:def.ghi');
    });

    it('trims whitespace before normalization', () => {
      expect(normalizeTimeInput('  1:23.456  ')).toBe('00:01:23.456');
      expect(normalizeTimeInput(' 23.456 ')).toBe('00:00:23.456');
    });

    it('handles CSV import bug cases correctly', () => {
      // Bug case 1: +5.404 should become +00:00:05.404 (not +00:00:40.447)
      expect(normalizeTimeInput('+5.404')).toBe('+00:00:05.404');
      expect(normalizeTimeInput('5.404')).toBe('00:00:05.404');

      // Bug case 2: + 14.16 (with space after +) should become +00:00:14.160
      expect(normalizeTimeInput('+ 14.16')).toBe('+00:00:14.160');
      expect(normalizeTimeInput(' + 14.16 ')).toBe('+00:00:14.160');
    });
  });

  describe('isValidTimeFormat', () => {
    it('accepts valid time formats', () => {
      expect(isValidTimeFormat('01:23:45.678')).toBe(true);
      expect(isValidTimeFormat('00:00:00.000')).toBe(true);
      expect(isValidTimeFormat('1:23:45.6')).toBe(true);
      expect(isValidTimeFormat('+00:00:02.104')).toBe(true);
    });

    it('accepts empty/null values', () => {
      expect(isValidTimeFormat('')).toBe(true);
      expect(isValidTimeFormat(null)).toBe(true);
      expect(isValidTimeFormat(undefined)).toBe(true);
    });

    it('rejects invalid formats', () => {
      expect(isValidTimeFormat('invalid')).toBe(false);
      expect(isValidTimeFormat('01:23:45')).toBe(false);
      expect(isValidTimeFormat('1:2:3.4')).toBe(false);
    });
  });

  describe('parseTimeToMs', () => {
    it('parses time string to milliseconds', () => {
      expect(parseTimeToMs('01:23:45.678')).toBe(5025678);
      expect(parseTimeToMs('00:00:00.000')).toBe(0);
      expect(parseTimeToMs('00:01:00.000')).toBe(60000);
    });

    it('handles variable millisecond lengths', () => {
      expect(parseTimeToMs('00:00:00.1')).toBe(100);
      expect(parseTimeToMs('00:00:00.12')).toBe(120);
      expect(parseTimeToMs('00:00:00.123')).toBe(123);
    });

    it('returns null for empty values', () => {
      expect(parseTimeToMs('')).toBe(null);
      expect(parseTimeToMs(null)).toBe(null);
    });
  });

  describe('formatMsToTime', () => {
    it('formats milliseconds to time string', () => {
      expect(formatMsToTime(5025678)).toBe('01:23:45.678');
      expect(formatMsToTime(0)).toBe('00:00:00.000');
      expect(formatMsToTime(60000)).toBe('00:01:00.000');
    });
  });

  describe('calculateRaceTimeFromDifference', () => {
    it('adds difference to leader time', () => {
      const leaderMs = 5025678; // 01:23:45.678
      const diffMs = 2104; // +00:00:02.104
      expect(calculateRaceTimeFromDifference(leaderMs, diffMs)).toBe('01:23:47.782');
    });

    it('returns null if either value is null', () => {
      expect(calculateRaceTimeFromDifference(null, 1000)).toBe(null);
      expect(calculateRaceTimeFromDifference(1000, null)).toBe(null);
    });
  });
});
