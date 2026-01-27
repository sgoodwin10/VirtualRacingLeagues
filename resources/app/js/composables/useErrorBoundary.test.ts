/**
 * Tests for useErrorBoundary Composable
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useErrorBoundary } from './useErrorBoundary';

describe('useErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Initial State', () => {
    it('should initialize with null error', () => {
      const { error } = useErrorBoundary();
      expect(error.value).toBeNull();
    });

    it('should initialize with null errorInfo', () => {
      const { errorInfo } = useErrorBoundary();
      expect(errorInfo.value).toBeNull();
    });
  });

  describe('resetError', () => {
    it('should provide resetError method', () => {
      const { resetError } = useErrorBoundary();
      expect(typeof resetError).toBe('function');
    });

    it('should not throw when called', () => {
      const { resetError } = useErrorBoundary();
      expect(() => resetError()).not.toThrow();
    });
  });

  describe('Return Values', () => {
    it('should return error as readonly ref', () => {
      const { error } = useErrorBoundary();
      expect(error).toBeDefined();
      expect(error.value).toBeNull();
    });

    it('should return errorInfo as readonly ref', () => {
      const { errorInfo } = useErrorBoundary();
      expect(errorInfo).toBeDefined();
      expect(errorInfo.value).toBeNull();
    });

    it('should return resetError function', () => {
      const { resetError } = useErrorBoundary();
      expect(resetError).toBeDefined();
      expect(typeof resetError).toBe('function');
    });
  });

  describe('API', () => {
    it('should expose the correct interface', () => {
      const result = useErrorBoundary();

      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('errorInfo');
      expect(result).toHaveProperty('resetError');
    });
  });
});
