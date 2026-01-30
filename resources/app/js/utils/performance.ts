import * as Sentry from '@sentry/vue';

/**
 * Measure the performance of an async function
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>,
  op: string = 'function',
): Promise<T> {
  return Sentry.startSpan(
    {
      name,
      op,
    },
    async () => {
      return await fn();
    },
  );
}

/**
 * Add a synchronous span
 */
export function addSpan<T>(description: string, fn: () => T, op: string = 'function'): T {
  return Sentry.startSpan(
    {
      name: description,
      op,
    },
    () => {
      return fn();
    },
  );
}
