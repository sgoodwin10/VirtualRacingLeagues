import { vi } from 'vitest';
import { config } from '@vue/test-utils';
import { setupMockServer } from './mocks/server';

// Global test setup for Vitest

// ========================================
// MSW (Mock Service Worker) Setup
// ========================================
// Enable API mocking for all tests
setupMockServer();

// Mock window.matchMedia (used by PrimeVue, VueUse, and responsive components)
// This mock needs to support both direct access and as a function
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn((query: string) => {
    const mediaQueryList = {
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
    return mediaQueryList;
  }),
});

// Mock IntersectionObserver (used by lazy loading, infinite scroll, etc.)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver (used by some UI components)
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Configure Vue Test Utils globally
config.global.stubs = {
  // Stub Teleport to avoid issues in tests
  Teleport: true,
  // You can add PrimeVue component stubs here if needed
  // 'p-dialog': true,
};

// Global mocks for common browser APIs
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

// Create a proper localStorage mock that actually stores values
const createStorageMock = () => {
  const store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }),
  };
};

Object.defineProperty(window, 'localStorage', {
  value: createStorageMock(),
  writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: createStorageMock(),
  writable: true,
});

// Suppress console warnings in tests (optional - comment out if you want to see warnings)
// global.console.warn = vi.fn();
