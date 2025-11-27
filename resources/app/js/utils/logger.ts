/**
 * Centralized logging utility for consistent error and debug logging
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogOptions {
  context?: string;
  data?: unknown;
}

/**
 * Format a log message with context
 */
const formatMessage = (message: string, context?: string): string => {
  return context ? `[${context}] ${message}` : message;
};

/**
 * Log an error message with optional context and data
 */
export const logError = (message: string, options?: LogOptions): void => {
  const formattedMessage = formatMessage(message, options?.context);

  if (options?.data) {
    console.error(formattedMessage, options.data);
  } else {
    console.error(formattedMessage);
  }
};

/**
 * Log a warning message with optional context and data
 */
export const logWarn = (message: string, options?: LogOptions): void => {
  const formattedMessage = formatMessage(message, options?.context);

  if (options?.data) {
    console.warn(formattedMessage, options.data);
  } else {
    console.warn(formattedMessage);
  }
};

/**
 * Log an info message with optional context and data
 */
export const logInfo = (message: string, options?: LogOptions): void => {
  const formattedMessage = formatMessage(message, options?.context);

  if (options?.data) {
    console.info(formattedMessage, options.data);
  } else {
    console.info(formattedMessage);
  }
};

/**
 * Log a debug message with optional context and data
 * Only logs in development mode
 */
export const logDebug = (message: string, options?: LogOptions): void => {
  if (import.meta.env.DEV) {
    const formattedMessage = formatMessage(message, options?.context);

    if (options?.data) {
      // eslint-disable-next-line no-console
      console.debug(formattedMessage, options.data);
    } else {
      // eslint-disable-next-line no-console
      console.debug(formattedMessage);
    }
  }
};

/**
 * Create a logger instance with a specific context
 * This is useful for component-specific logging
 */
export const createLogger = (context: string) => ({
  error: (message: string, data?: unknown) => logError(message, { context, data }),
  warn: (message: string, data?: unknown) => logWarn(message, { context, data }),
  info: (message: string, data?: unknown) => logInfo(message, { context, data }),
  debug: (message: string, data?: unknown) => logDebug(message, { context, data }),
});
