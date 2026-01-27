import { describe, it, expect } from 'vitest';
import { useStatusHelpers } from './useStatusHelpers';

describe('useStatusHelpers', () => {
  const { getStatusLabel, getStatusVariant, getStatusIcon, isActive, isInactive, isSuspended } =
    useStatusHelpers();

  describe('getStatusLabel', () => {
    it('should return Active for active status', () => {
      expect(getStatusLabel('active')).toBe('Active');
    });

    it('should return Inactive for inactive status', () => {
      expect(getStatusLabel('inactive')).toBe('Inactive');
    });

    it('should return Suspended for suspended status', () => {
      expect(getStatusLabel('suspended')).toBe('Suspended');
    });

    it('should return original value for unknown status', () => {
      expect(getStatusLabel('unknown' as any)).toBe('unknown');
    });
  });

  describe('getStatusVariant', () => {
    it('should return success for active status', () => {
      expect(getStatusVariant('active')).toBe('success');
    });

    it('should return secondary for inactive status', () => {
      expect(getStatusVariant('inactive')).toBe('secondary');
    });

    it('should return danger for suspended status', () => {
      expect(getStatusVariant('suspended')).toBe('danger');
    });

    it('should return secondary for unknown status', () => {
      expect(getStatusVariant('unknown' as any)).toBe('secondary');
    });
  });

  describe('getStatusIcon', () => {
    it('should return pi-circle-fill for active status', () => {
      expect(getStatusIcon('active')).toBe('pi-circle-fill');
    });

    it('should return pi-circle for inactive status', () => {
      expect(getStatusIcon('inactive')).toBe('pi-circle');
    });

    it('should return pi-ban for suspended status', () => {
      expect(getStatusIcon('suspended')).toBe('pi-ban');
    });

    it('should return pi-circle for unknown status', () => {
      expect(getStatusIcon('unknown' as any)).toBe('pi-circle');
    });
  });

  describe('isActive', () => {
    it('should return true for active status', () => {
      expect(isActive('active')).toBe(true);
    });

    it('should return false for inactive status', () => {
      expect(isActive('inactive')).toBe(false);
    });

    it('should return false for suspended status', () => {
      expect(isActive('suspended')).toBe(false);
    });
  });

  describe('isInactive', () => {
    it('should return true for inactive status', () => {
      expect(isInactive('inactive')).toBe(true);
    });

    it('should return false for active status', () => {
      expect(isInactive('active')).toBe(false);
    });

    it('should return false for suspended status', () => {
      expect(isInactive('suspended')).toBe(false);
    });
  });

  describe('isSuspended', () => {
    it('should return true for suspended status', () => {
      expect(isSuspended('suspended')).toBe(true);
    });

    it('should return false for active status', () => {
      expect(isSuspended('active')).toBe(false);
    });

    it('should return false for inactive status', () => {
      expect(isSuspended('inactive')).toBe(false);
    });
  });
});
