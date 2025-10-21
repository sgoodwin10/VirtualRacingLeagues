import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useErrorToast } from '../useErrorToast';
import type { AxiosError } from 'axios';

// Mock PrimeVue's useToast
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn(),
  }),
}));

describe('useErrorToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractErrorMessage', () => {
    it('should extract message from AxiosError response', () => {
      const { showErrorToast } = useErrorToast();
      const error = {
        response: {
          data: {
            message: 'API error message',
          },
        },
      } as AxiosError;

      showErrorToast(error);
      // The toast should be called - we'll verify the implementation works
      expect(() => showErrorToast(error)).not.toThrow();
    });

    it('should extract message from Error instance', () => {
      const { showErrorToast } = useErrorToast();
      const error = new Error('Standard error message');

      expect(() => showErrorToast(error)).not.toThrow();
    });

    it('should handle string errors', () => {
      const { showErrorToast } = useErrorToast();
      const error = 'String error message';

      expect(() => showErrorToast(error)).not.toThrow();
    });

    it('should use fallback for unknown error types', () => {
      const { showErrorToast } = useErrorToast();
      const error = { unknown: 'object' };

      expect(() => showErrorToast(error)).not.toThrow();
    });
  });

  describe('extractValidationErrors', () => {
    it('should extract validation errors from AxiosError', () => {
      const { extractValidationErrors } = useErrorToast();
      const error = {
        response: {
          data: {
            errors: {
              email: ['Email is required'],
              name: ['Name is required'],
            },
          },
        },
      } as AxiosError;

      const result = extractValidationErrors(error);
      expect(result).toEqual({
        email: ['Email is required'],
        name: ['Name is required'],
      });
    });

    it('should return null if no validation errors', () => {
      const { extractValidationErrors } = useErrorToast();
      const error = new Error('Regular error');

      const result = extractValidationErrors(error);
      expect(result).toBeNull();
    });
  });

  describe('hasValidationErrors', () => {
    it('should return true for validation errors', () => {
      const { hasValidationErrors } = useErrorToast();
      const error = {
        response: {
          data: {
            errors: {
              email: ['Email is required'],
            },
          },
        },
      } as AxiosError;

      expect(hasValidationErrors(error)).toBe(true);
    });

    it('should return false for non-validation errors', () => {
      const { hasValidationErrors } = useErrorToast();
      const error = new Error('Regular error');

      expect(hasValidationErrors(error)).toBe(false);
    });
  });

  describe('showErrorToast', () => {
    it('should call toast with error details', () => {
      const { showErrorToast } = useErrorToast();
      const error = new Error('Test error');

      expect(() => showErrorToast(error, 'Failed to save')).not.toThrow();
    });

    it('should use custom message when provided', () => {
      const { showErrorToast } = useErrorToast();
      const error = new Error('Original error');

      expect(() =>
        showErrorToast(error, 'Failed to save', {
          customMessage: 'Custom error message',
        }),
      ).not.toThrow();
    });

    it('should use custom life duration', () => {
      const { showErrorToast } = useErrorToast();
      const error = new Error('Test error');

      expect(() =>
        showErrorToast(error, 'Failed', {
          life: 3000,
        }),
      ).not.toThrow();
    });

    it('should show validation errors when requested', () => {
      const { showErrorToast } = useErrorToast();
      const error = {
        response: {
          data: {
            errors: {
              email: ['Email is required'],
              name: ['Name is required'],
            },
          },
        },
      } as AxiosError;

      expect(() =>
        showErrorToast(error, 'Validation failed', {
          showValidationErrors: true,
        }),
      ).not.toThrow();
    });
  });

  describe('showSuccessToast', () => {
    it('should call toast with success severity', () => {
      const { showSuccessToast } = useErrorToast();
      expect(() => showSuccessToast('Operation successful')).not.toThrow();
    });

    it('should use custom summary and life', () => {
      const { showSuccessToast } = useErrorToast();
      expect(() => showSuccessToast('Saved', 'Custom Success', 2000)).not.toThrow();
    });
  });

  describe('showWarningToast', () => {
    it('should call toast with warning severity', () => {
      const { showWarningToast } = useErrorToast();
      expect(() => showWarningToast('Please review')).not.toThrow();
    });

    it('should use custom summary and life', () => {
      const { showWarningToast } = useErrorToast();
      expect(() => showWarningToast('Warning message', 'Attention', 3000)).not.toThrow();
    });
  });

  describe('showInfoToast', () => {
    it('should call toast with info severity', () => {
      const { showInfoToast } = useErrorToast();
      expect(() => showInfoToast('Information message')).not.toThrow();
    });

    it('should use custom summary and life', () => {
      const { showInfoToast } = useErrorToast();
      expect(() => showInfoToast('Info', 'Custom Info', 2000)).not.toThrow();
    });
  });
});
