import { describe, it, expect } from 'vitest';
import { useTimeFormat } from '../useTimeFormat';

describe('useTimeFormat', () => {
  const { formatRaceTime } = useTimeFormat();

  describe('formatRaceTime', () => {
    describe('should handle null, undefined, and empty values', () => {
      it('should return "-" for null', () => {
        expect(formatRaceTime(null)).toBe('-');
      });

      it('should return "-" for undefined', () => {
        expect(formatRaceTime(undefined)).toBe('-');
      });

      it('should return "-" for empty string', () => {
        expect(formatRaceTime('')).toBe('-');
      });

      it('should return "-" for whitespace-only string', () => {
        expect(formatRaceTime('   ')).toBe('-');
      });
    });

    describe('should format times with hours', () => {
      it('should format time with 1 hour', () => {
        expect(formatRaceTime('01:02:03.456')).toBe('1:02:03.456');
      });

      it('should format time with 2 hours', () => {
        expect(formatRaceTime('02:15:30.123')).toBe('2:15:30.123');
      });

      it('should format time with 10+ hours', () => {
        expect(formatRaceTime('12:34:56.789')).toBe('12:34:56.789');
      });

      it('should keep minute and second padding when hours exist', () => {
        expect(formatRaceTime('01:00:05.000')).toBe('1:00:05.000');
      });
    });

    describe('should format times with only minutes and seconds', () => {
      it('should format time with leading zero hours', () => {
        expect(formatRaceTime('00:02:23.342')).toBe('2:23.342');
      });

      it('should format time with 1 minute', () => {
        expect(formatRaceTime('00:01:30.500')).toBe('1:30.500');
      });

      it('should format time with 12 minutes', () => {
        expect(formatRaceTime('00:12:34.567')).toBe('12:34.567');
      });

      it('should format time with 59 minutes', () => {
        expect(formatRaceTime('00:59:59.999')).toBe('59:59.999');
      });

      it('should keep second padding when minutes exist', () => {
        expect(formatRaceTime('00:05:03.100')).toBe('5:03.100');
      });
    });

    describe('should format times with only seconds', () => {
      it('should format time with only seconds', () => {
        expect(formatRaceTime('00:00:45.123')).toBe('45.123');
      });

      it('should format time with single-digit seconds', () => {
        expect(formatRaceTime('00:00:05.500')).toBe('05.500');
      });

      it('should format time with zero seconds', () => {
        expect(formatRaceTime('00:00:00.999')).toBe('00.999');
      });

      it('should keep second padding for consistency', () => {
        expect(formatRaceTime('00:00:03.250')).toBe('03.250');
      });
    });

    describe('should handle different millisecond formats', () => {
      it('should handle 1-digit milliseconds', () => {
        expect(formatRaceTime('00:01:23.4')).toBe('1:23.4');
      });

      it('should handle 2-digit milliseconds', () => {
        expect(formatRaceTime('00:01:23.45')).toBe('1:23.45');
      });

      it('should handle 3-digit milliseconds', () => {
        expect(formatRaceTime('00:01:23.456')).toBe('1:23.456');
      });
    });

    describe('should handle time differences with + prefix', () => {
      it('should format positive time difference with seconds only', () => {
        expect(formatRaceTime('+00:00:14.160')).toBe('+14.160');
      });

      it('should format positive time difference with minutes', () => {
        expect(formatRaceTime('+00:01:23.456')).toBe('+1:23.456');
      });

      it('should format positive time difference with hours', () => {
        expect(formatRaceTime('+01:15:30.250')).toBe('+1:15:30.250');
      });

      it('should format small positive difference', () => {
        expect(formatRaceTime('+00:00:00.500')).toBe('+00.500');
      });
    });

    describe('should handle edge cases', () => {
      it('should return invalid time string as-is', () => {
        expect(formatRaceTime('invalid')).toBe('invalid');
      });

      it('should return malformed time as-is', () => {
        expect(formatRaceTime('12:34')).toBe('12:34');
      });

      it('should return time without milliseconds as-is', () => {
        expect(formatRaceTime('00:01:23')).toBe('00:01:23');
      });

      it('should handle time with extra spaces (returns as-is if malformed)', () => {
        expect(formatRaceTime('00 :01:23.456')).toBe('00 :01:23.456');
      });
    });

    describe('real-world examples', () => {
      it('should format typical race times', () => {
        expect(formatRaceTime('00:02:23.342')).toBe('2:23.342');
        expect(formatRaceTime('00:12:45.678')).toBe('12:45.678');
        expect(formatRaceTime('01:23:45.901')).toBe('1:23:45.901');
      });

      it('should format typical qualifying times', () => {
        expect(formatRaceTime('00:01:34.567')).toBe('1:34.567');
        expect(formatRaceTime('00:01:35.123')).toBe('1:35.123');
      });

      it('should format fastest lap times', () => {
        expect(formatRaceTime('00:01:23.456')).toBe('1:23.456');
        expect(formatRaceTime('00:00:59.999')).toBe('59.999');
      });

      it('should format time gaps', () => {
        expect(formatRaceTime('+00:00:02.345')).toBe('+02.345');
        expect(formatRaceTime('+00:01:15.678')).toBe('+1:15.678');
      });

      it('should format penalties', () => {
        expect(formatRaceTime('00:00:05.000')).toBe('05.000');
        expect(formatRaceTime('00:00:10.000')).toBe('10.000');
      });
    });
  });
});
