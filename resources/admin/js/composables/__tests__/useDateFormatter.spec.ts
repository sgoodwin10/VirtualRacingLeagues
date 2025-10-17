import { describe, it, expect } from 'vitest';
import { useDateFormatter } from '../useDateFormatter';

describe('useDateFormatter', () => {
  const { formatDate, formatRelativeTime } = useDateFormatter();

  describe('formatDate', () => {
    it('should format valid ISO date string', () => {
      const result = formatDate('2025-08-03T16:43:00Z');
      expect(result).toMatch(/4:43[ap]m 3rd Aug 25/i);
    });

    it('should return Never for null', () => {
      expect(formatDate(null)).toBe('Never');
    });

    it('should return Never for undefined', () => {
      expect(formatDate(undefined)).toBe('Never');
    });

    it('should return Never for empty string', () => {
      expect(formatDate('')).toBe('Never');
    });

    it('should return Invalid date for invalid date string', () => {
      expect(formatDate('not a date')).toBe('Invalid date');
    });

    it('should format with custom format string', () => {
      const result = formatDate('2025-08-03T16:43:00Z', 'yyyy-MM-dd');
      expect(result).toBe('2025-08-03');
    });

    it('should handle date without time', () => {
      const result = formatDate('2025-08-03');
      expect(result).toMatch(/3rd Aug 25/);
    });

    it('should handle different time zones', () => {
      const result = formatDate('2025-08-03T16:43:00+02:00');
      expect(result).toBeDefined();
      expect(result).not.toBe('Invalid date');
    });
  });

  describe('formatRelativeTime', () => {
    it('should return Never for null', () => {
      expect(formatRelativeTime(null)).toBe('Never');
    });

    it('should return Never for undefined', () => {
      expect(formatRelativeTime(undefined)).toBe('Never');
    });

    it('should return Never for empty string', () => {
      expect(formatRelativeTime('')).toBe('Never');
    });

    it('should return Invalid date for invalid date string', () => {
      expect(formatRelativeTime('not a date')).toBe('Invalid date');
    });

    it('should format recent date as relative time', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const result = formatRelativeTime(twoHoursAgo.toISOString());
      expect(result).toMatch(/hours? ago/);
    });

    it('should format future date correctly', () => {
      const now = new Date();
      const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const result = formatRelativeTime(inTwoHours.toISOString());
      expect(result).toMatch(/in.*hours?/);
    });

    it('should format old date correctly', () => {
      const result = formatRelativeTime('2020-01-01T00:00:00Z');
      expect(result).toMatch(/years? ago/);
    });
  });
});
