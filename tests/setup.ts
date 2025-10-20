import { vi } from 'vitest';
import { config } from '@vue/test-utils';
import { setupMockServer } from './mocks/server';
import '@testing-library/jest-dom/vitest';

// Global test setup for Vitest

// ========================================
// Testing Library Matchers
// ========================================
// Adds custom matchers like toBeInTheDocument(), toHaveValue(), etc.
// See: https://github.com/testing-library/jest-dom

// ========================================
// MSW (Mock Service Worker) Setup
// ========================================
// Enable API mocking for all tests
setupMockServer();

// Mock window.matchMedia (used by PrimeVue and responsive components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
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

Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
});

Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
});

// Suppress console warnings in tests (optional - comment out if you want to see warnings)
// global.console.warn = vi.fn();
