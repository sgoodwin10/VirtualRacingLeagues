/**
 * Development-aware logging utility
 * Only logs debug/info messages in development mode
 * Always logs warnings and errors
 */

const isDevelopment = import.meta.env.DEV;

/**
 * Logger utility for consistent logging across the application
 *
 * @example
 * ```typescript
 * import { logger } from '@admin/utils/logger';
 *
 * logger.debug('User data:', user);
 * logger.info('Operation completed');
 * logger.warn('Deprecated API usage');
 * logger.error('Failed to fetch data', error);
 * ```
 */
export const logger = {
  /**
   * Log debug messages (development only)
   * Use for detailed debugging information
   *
   * @param args - Arguments to log
   */
  debug: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Log informational messages (development only)
   * Use for general information about application flow
   *
   * @param args - Arguments to log
   */
  info: (...args: unknown[]): void => {
    if (isDevelopment) {
      console.info('[INFO]', ...args);
    }
  },

  /**
   * Log warning messages (always logged)
   * Use for potentially harmful situations
   *
   * @param args - Arguments to log
   */
  warn: (...args: unknown[]): void => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Log error messages (always logged)
   * Use for error events
   *
   * @param args - Arguments to log
   */
  error: (...args: unknown[]): void => {
    console.error('[ERROR]', ...args);
  },
};
