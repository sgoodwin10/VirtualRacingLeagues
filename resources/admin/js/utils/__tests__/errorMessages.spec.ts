import { describe, it, expect } from 'vitest';
import { getSafeErrorMessage, isUserFacingError } from '../errorMessages';
import { AxiosError } from 'axios';

describe('errorMessages', () => {
  describe('getSafeErrorMessage', () => {
    it('should sanitize network errors', () => {
      const error = new Error('ECONNREFUSED: Connection refused');

      const message = getSafeErrorMessage(error);

      expect(message).not.toContain('ECONNREFUSED');
      expect(message).toContain('Unable to connect');
    });

    it('should sanitize database errors', () => {
      const error = new Error('SQL syntax error near line 42');

      const message = getSafeErrorMessage(error);

      expect(message).not.toContain('SQL');
      expect(message).toContain('database error');
    });

    it('should sanitize server errors', () => {
      const error = new AxiosError('Server error', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 500,
        statusText: 'Internal Server Error',
        data: { message: 'Internal server error occurred' },
        headers: {},
        config: {} as any,
      });

      const message = getSafeErrorMessage(error);

      expect(message).toContain('server error');
    });

    it('should preserve user-facing messages', () => {
      const error = new Error('Email address is already in use');

      const message = getSafeErrorMessage(error);

      expect(message).toBe('Email address is already in use');
    });

    it('should return default message for unknown errors', () => {
      const error = { weird: 'object' };

      const message = getSafeErrorMessage(error);

      expect(message).toBe('An unexpected error occurred');
    });

    it('should handle timeout errors', () => {
      const error = new Error('ETIMEDOUT');

      const message = getSafeErrorMessage(error);

      expect(message).not.toContain('ETIMEDOUT');
      expect(message).toContain('Unable to connect');
    });

    it('should handle 502/503/504 errors', () => {
      const error502 = new Error('502 Bad Gateway');
      const error503 = new Error('503 Service Unavailable');
      const error504 = new Error('504 Gateway Timeout');

      expect(getSafeErrorMessage(error502)).toContain('temporarily unavailable');
      expect(getSafeErrorMessage(error503)).toContain('temporarily unavailable');
      expect(getSafeErrorMessage(error504)).toContain('timed out');
    });

    it('should use custom default message', () => {
      const error = { weird: 'object' };

      const message = getSafeErrorMessage(error, 'Custom default');

      // getSafeErrorMessage will use the default error message constant
      // when no message is extractable, not the custom default
      expect(message).toBe('Custom default');
    });
  });

  describe('isUserFacingError', () => {
    it('should return false for technical errors', () => {
      const error = new Error('ECONNREFUSED');

      expect(isUserFacingError(error)).toBe(false);
    });

    it('should return true for user-facing errors', () => {
      const error = new Error('Invalid email address');

      expect(isUserFacingError(error)).toBe(true);
    });

    it('should return false for SQL errors', () => {
      const error = new Error('SQL syntax error');

      expect(isUserFacingError(error)).toBe(false);
    });

    it('should return true for user-friendly errors', () => {
      const error = new Error('Invalid email format');

      expect(isUserFacingError(error)).toBe(true);
    });
  });
});
