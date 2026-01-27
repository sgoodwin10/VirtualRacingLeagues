import { describe, it, expect } from 'vitest';
import { useTimeFormat } from './useTimeFormat';

describe('useTimeFormat', () => {
  describe('formatRaceTime', () => {
    describe('Null/undefined/empty handling', () => {
      it('should return "-" for null', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime(null)).toBe('-');
      });

      it('should return "-" for undefined', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime(undefined)).toBe('-');
      });

      it('should return "-" for empty string', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('')).toBe('-');
      });

      it('should return "-" for whitespace-only string', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('   ')).toBe('-');
      });
    });

    describe('Hours:Minutes:Seconds.Milliseconds formatting', () => {
      it('should format time with hours', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('01:23:45.678')).toBe('1:23:45.678');
      });

      it('should remove leading hour zeros', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('00:02:23.342')).toBe('2:23.342');
      });

      it('should remove leading minute zeros when no hours', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('00:00:45.123')).toBe('45.123');
      });

      it('should keep hour with minutes padding', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('01:02:03.456')).toBe('1:02:03.456');
      });

      it('should keep minute padding when hours are zero', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('00:12:34.567')).toBe('12:34.567');
      });

      it('should keep second padding', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('00:00:05.123')).toBe('05.123');
      });

      it('should format time with double-digit hours', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('12:34:56.789')).toBe('12:34:56.789');
      });

      it('should format time with zero hours and non-zero minutes', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('00:15:30.500')).toBe('15:30.500');
      });

      it('should handle single-digit milliseconds', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('00:01:23.4')).toBe('1:23.4');
      });

      it('should handle double-digit milliseconds', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('00:01:23.45')).toBe('1:23.45');
      });

      it('should handle triple-digit milliseconds', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('00:01:23.456')).toBe('1:23.456');
      });
    });

    describe('Plus prefix handling', () => {
      it('should handle +prefix with hours', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('+01:23:45.678')).toBe('+1:23:45.678');
      });

      it('should handle +prefix with minutes only', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('+00:01:23.456')).toBe('+1:23.456');
      });

      it('should handle +prefix with seconds only', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('+00:00:14.160')).toBe('+14.160');
      });

      it('should preserve + sign in formatted output', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('+00:02:15.123')).toBe('+2:15.123');
      });
    });

    describe('Invalid format handling', () => {
      it('should return as-is for non-matching format', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('invalid')).toBe('invalid');
      });

      it('should return as-is for incomplete time', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('12:34')).toBe('12:34');
      });

      it('should return as-is for time without milliseconds', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('01:23:45')).toBe('01:23:45');
      });

      it('should return as-is for malformed time', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('1:2:3.4')).toBe('1:2:3.4');
      });

      it('should return as-is for time with incorrect separator', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('01-23-45.678')).toBe('01-23-45.678');
      });

      it('should return as-is for time with missing decimal', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('01:23:45,678')).toBe('01:23:45,678');
      });
    });

    describe('Edge cases', () => {
      it('should handle all zeros', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('00:00:00.000')).toBe('00.000');
      });

      it('should handle maximum values', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('99:59:59.999')).toBe('99:59:59.999');
      });

      it('should handle minimum non-zero time', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('00:00:00.001')).toBe('00.001');
      });

      it('should handle one hour exactly', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('01:00:00.000')).toBe('1:00:00.000');
      });

      it('should handle one minute exactly', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('00:01:00.000')).toBe('1:00.000');
      });

      it('should handle one second exactly', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('00:00:01.000')).toBe('01.000');
      });

      it('should handle time at boundary (09:59:59.999)', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('09:59:59.999')).toBe('9:59:59.999');
      });

      it('should handle time crossing boundary (10:00:00.000)', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('10:00:00.000')).toBe('10:00:00.000');
      });
    });

    describe('Real-world examples', () => {
      it('should format typical lap time', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('00:01:32.456')).toBe('1:32.456');
      });

      it('should format fast lap time', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('00:00:58.123')).toBe('58.123');
      });

      it('should format long race time', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('02:15:43.789')).toBe('2:15:43.789');
      });

      it('should format gap time with plus', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('+00:00:05.234')).toBe('+05.234');
      });

      it('should format lap behind with plus', () => {
        const { formatRaceTime } = useTimeFormat();

        expect(formatRaceTime('+00:01:25.678')).toBe('+1:25.678');
      });
    });
  });

  describe('Return value interface', () => {
    it('should return formatRaceTime function', () => {
      const result = useTimeFormat();

      expect(result).toHaveProperty('formatRaceTime');
      expect(typeof result.formatRaceTime).toBe('function');
    });
  });
});
