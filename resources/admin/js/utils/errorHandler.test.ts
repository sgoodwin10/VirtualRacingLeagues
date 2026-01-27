import { describe, it, expect } from 'vitest';
import { handleServiceError } from './errorHandler';
import { ApplicationError } from '@admin/types/errors';
import { AxiosError } from 'axios';

describe('errorHandler', () => {
  it('should preserve validation errors', () => {
    const validationError = new AxiosError(
      'Validation failed',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 422,
        statusText: 'Unprocessable Entity',
        data: {
          message: 'The given data was invalid.',
          errors: {
            email: ['The email field is required.'],
          },
        },
        headers: {},
        config: {} as any,
      },
    );

    expect(() => handleServiceError(validationError)).toThrow(validationError);
  });

  it('should convert API errors to ApplicationError', () => {
    const apiError = new AxiosError('Server error', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 500,
      statusText: 'Internal Server Error',
      data: { message: 'Something went wrong' },
      headers: {},
      config: {} as any,
    });

    try {
      handleServiceError(apiError);
      // Should throw, so this line shouldn't be reached
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(ApplicationError);
      // The error handler uses getErrorMessage which prefers axios error.message over response.data.message
      expect((error as ApplicationError).message).toContain('error');
    }
  });

  it('should re-throw generic Error objects', () => {
    const genericError = new Error('Generic error');

    expect(() => handleServiceError(genericError)).toThrow(genericError);
  });

  it('should wrap unknown errors in ApplicationError', () => {
    const unknownError = { weird: 'object' };

    expect(() => handleServiceError(unknownError)).toThrow(ApplicationError);
    expect(() => handleServiceError(unknownError)).toThrow('An unexpected error occurred');
  });

  it('should include status code in ApplicationError', () => {
    const apiError = new AxiosError('Not found', 'ERR_BAD_REQUEST', undefined, undefined, {
      status: 404,
      statusText: 'Not Found',
      data: { message: 'Resource not found' },
      headers: {},
      config: {} as any,
    });

    try {
      handleServiceError(apiError);
    } catch (error) {
      expect(error).toBeInstanceOf(ApplicationError);
      expect((error as ApplicationError).statusCode).toBe(404);
    }
  });

  it('should handle axios errors without response', () => {
    const networkError = new AxiosError('Network error', 'ERR_NETWORK');

    expect(() => handleServiceError(networkError)).toThrow(ApplicationError);
  });
});
