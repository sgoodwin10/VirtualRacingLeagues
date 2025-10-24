/**
 * Test Utilities for User Dashboard Tests
 *
 * Provides helper functions and utilities for testing Vue components in the user dashboard.
 */

import { mount, type VueWrapper, type MountingOptions } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { createRouter, createMemoryHistory, type RouteRecordRaw } from 'vue-router';
import { vi } from 'vitest';
import { primevueStubs } from './primevueStubs';
import type { Component, ComponentPublicInstance } from 'vue';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Aura from '@primevue/themes/aura';

/**
 * Creates a test Pinia instance
 */
export function createTestPinia() {
  return createPinia();
}

/**
 * Creates a test router instance with memory history
 */
export function createTestRouter(routes: RouteRecordRaw[] = []) {
  return createRouter({
    history: createMemoryHistory(),
    routes:
      routes.length > 0
        ? routes
        : [
            { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
            { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
            { path: '/leagues', name: 'leagues', component: { template: '<div>Leagues</div>' } },
            {
              path: '/leagues/:id',
              name: 'league-detail',
              component: { template: '<div>League Detail</div>' },
            },
            { path: '/profile', name: 'profile', component: { template: '<div>Profile</div>' } },
          ],
  });
}

/**
 * Mounts a Vue component with PrimeVue stubs and common testing setup
 *
 * This function wraps Vue Test Utils mount() with automatic PrimeVue stubbing,
 * Pinia store setup, and Vue Router setup.
 *
 * @param component - The Vue component to mount
 * @param options - Mount options (same as Vue Test Utils mount options)
 * @returns VueWrapper instance
 *
 * @example
 * ```typescript
 * const wrapper = mountWithStubs(MyComponent, {
 *   props: { title: 'Test' },
 *   global: {
 *     stubs: {
 *       // Additional stubs beyond PrimeVue
 *       MyCustomComponent: true,
 *     },
 *   },
 * });
 * ```
 */
export function mountWithStubs<T extends ComponentPublicInstance>(
  component: Component,
  options: MountingOptions<Record<string, unknown>> = {},
): VueWrapper<T> {
  // Merge PrimeVue stubs with any additional stubs provided
  const stubs = {
    ...primevueStubs,
    ...(options.global?.stubs || {}),
  };

  // Always include PrimeVue plugins, and merge with any custom plugins
  const customPlugins = options.global?.plugins || [];

  // Extract PrimeVue plugins from defaults
  const primevuePlugins = [
    [
      PrimeVue,
      {
        theme: {
          preset: Aura,
          options: {
            prefix: 'p',
            darkModeSelector: false,
            cssLayer: {
              name: 'primevue',
              order: 'theme, base, primevue',
            },
          },
        },
      },
    ],
    ToastService,
  ];

  // Check if custom plugins include Pinia or Router
  const hasPinia = customPlugins.some(
    (plugin) =>
      plugin &&
      typeof plugin === 'object' &&
      'install' in plugin &&
      ('_s' in plugin || '_p' in plugin),
  );
  const hasRouter = customPlugins.some(
    (plugin) =>
      plugin &&
      typeof plugin === 'object' &&
      'install' in plugin &&
      'options' in plugin &&
      'currentRoute' in plugin,
  );

  // Add default Pinia and Router only if not provided in custom plugins
  const defaultDataPlugins = [];
  if (!hasPinia) {
    defaultDataPlugins.push(createTestPinia());
  }
  if (!hasRouter) {
    defaultDataPlugins.push(createTestRouter());
  }

  // Merge plugins
  const plugins = [...customPlugins, ...defaultDataPlugins, ...primevuePlugins];

  // Add directives stubs
  const directives = {
    tooltip: {
      mounted: () => {},
      updated: () => {},
      unmounted: () => {},
    },
    ...(options.global?.directives || {}),
  };

  // Merge all global options
  const globalOptions = {
    ...options.global,
    plugins,
    stubs,
    directives,
  };

  // Mount component with merged options
  return mount(component, {
    ...options,
    global: globalOptions,
  }) as VueWrapper<T>;
}

/**
 * Waits for Vue to update the DOM and finish pending promises
 */
export async function flushPromises(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/**
 * Mock localStorage for tests
 */
export function mockLocalStorage() {
  const storage: Record<string, string> = {};

  return {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => {
      storage[key] = value;
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    clear: () => {
      Object.keys(storage).forEach((key) => delete storage[key]);
    },
    get length() {
      return Object.keys(storage).length;
    },
    key: (index: number) => {
      const keys = Object.keys(storage);
      return keys[index] || null;
    },
  };
}

/**
 * Mock window.matchMedia for responsive tests
 */
export function mockMatchMedia(matches = false) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

/**
 * Creates a mock API response
 */
export function createMockApiResponse<T>(data: T, status = 200) {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {},
    config: {},
  };
}

/**
 * Creates a mock API error
 */
export function createMockApiError(message: string, status = 500) {
  const error = new Error(message) as Error & {
    response: {
      data: { message: string };
      status: number;
      statusText: string;
      headers: Record<string, unknown>;
      config: Record<string, unknown>;
    };
  };
  error.response = {
    data: { message },
    status,
    statusText: 'Error',
    headers: {},
    config: {},
  };
  return error;
}

/**
 * Waits for a condition to be true
 */
export async function waitFor(
  condition: () => boolean,
  timeout = 1000,
  interval = 50,
): Promise<void> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('waitFor timeout exceeded');
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Finds a component by name (useful for stubbed PrimeVue components)
 */
export function findComponentByName<T extends ComponentPublicInstance>(
  wrapper: VueWrapper<ComponentPublicInstance>,
  name: string,
): VueWrapper<T> | undefined {
  return wrapper.findComponent({ name }) as VueWrapper<T> | undefined;
}

/**
 * Finds all components by name
 */
export function findAllComponentsByName<T extends ComponentPublicInstance>(
  wrapper: VueWrapper<ComponentPublicInstance>,
  name: string,
): VueWrapper<T>[] {
  return wrapper.findAllComponents({ name }) as VueWrapper<T>[];
}

/**
 * Triggers a native event on an element
 */
export async function triggerNativeEvent(
  element: Element,
  eventType: string,
  eventData: Record<string, unknown> = {},
): Promise<void> {
  const event = new Event(eventType, { bubbles: true, cancelable: true });
  Object.assign(event, eventData);
  element.dispatchEvent(event);
  await flushPromises();
}

/**
 * Mock console methods for tests
 */
export function mockConsole() {
  return {
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    info: vi.spyOn(console, 'info').mockImplementation(() => {}),
  };
}

/**
 * Restore console methods after tests
 */
export function restoreConsole(mocks: ReturnType<typeof mockConsole>) {
  Object.values(mocks).forEach((mock) => mock.mockRestore());
}

export default {
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
};
