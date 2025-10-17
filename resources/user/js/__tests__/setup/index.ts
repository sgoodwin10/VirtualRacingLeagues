/**
 * Test Setup - Central Export
 *
 * This file exports all test utilities and PrimeVue stubs for easy importing in test files.
 *
 * @example
 * ```typescript
 * import { mountWithStubs, primevueStubs } from '@user/__tests__/setup';
 * ```
 */

// Export all test utilities
export {
  mountWithStubs,
  createTestPinia,
  createTestRouter,
  flushPromises,
  mockLocalStorage,
  mockMatchMedia,
  createMockApiResponse,
  createMockApiError,
  waitFor,
  findComponentByName,
  findAllComponentsByName,
  triggerNativeEvent,
  mockConsole,
  restoreConsole,
} from './testUtils';

// Export PrimeVue stubs and individual components
export * from './primevueStubs';

// Default export with all utilities
export { default } from './testUtils';
