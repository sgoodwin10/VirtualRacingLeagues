import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '../logger';

describe('logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log debug messages in development', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    logger.debug('Test debug message', { data: 'test' });

    if (import.meta.env.DEV) {
      expect(consoleSpy).toHaveBeenCalledWith('[DEBUG]', 'Test debug message', { data: 'test' });
    } else {
      expect(consoleSpy).not.toHaveBeenCalled();
    }

    consoleSpy.mockRestore();
  });

  it('should log info messages in development', () => {
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    logger.info('Test info message');

    if (import.meta.env.DEV) {
      expect(consoleSpy).toHaveBeenCalledWith('[INFO]', 'Test info message');
    } else {
      expect(consoleSpy).not.toHaveBeenCalled();
    }

    consoleSpy.mockRestore();
  });

  it('should always log warnings', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    logger.warn('Test warning');

    expect(consoleSpy).toHaveBeenCalledWith('[WARN]', 'Test warning');

    consoleSpy.mockRestore();
  });

  it('should always log errors', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logger.error('Test error', new Error('Test'));

    expect(consoleSpy).toHaveBeenCalledWith('[ERROR]', 'Test error', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('should support multiple arguments', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    logger.error('Error occurred', { code: 500 }, 'Additional info');

    expect(consoleSpy).toHaveBeenCalledWith(
      '[ERROR]',
      'Error occurred',
      { code: 500 },
      'Additional info'
    );

    consoleSpy.mockRestore();
  });
});
