import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { nextTick } from 'vue';
import { useTheme, __resetThemeForTesting } from '../useTheme';
import type { Theme } from '../useTheme';

describe('useTheme', () => {
  let localStorageMock: Record<string, string>;
  let mediaQueryListeners: Map<string, (e: MediaQueryListEvent) => void>;
  let currentMediaQuery: string;

  beforeEach(() => {
    // Reset the singleton state before each test
    __resetThemeForTesting();
    // Reset localStorage mock
    localStorageMock = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(() => null),
    };

    // Reset media query mock
    mediaQueryListeners = new Map();
    currentMediaQuery = 'dark'; // Default to dark

    global.window.matchMedia = vi.fn((query: string) => {
      const matches = query.includes('light')
        ? currentMediaQuery === 'light'
        : currentMediaQuery === 'dark';

      return {
        matches,
        media: query,
        addEventListener: vi.fn((event: string, handler: (e: MediaQueryListEvent) => void) => {
          if (event === 'change') {
            mediaQueryListeners.set(query, handler);
          }
        }),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onchange: null,
      } as unknown as MediaQueryList;
    });

    // Reset document.documentElement
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    vi.clearAllMocks();
    mediaQueryListeners.clear();
  });

  describe('initialization', () => {
    it('should initialize with system theme (dark) when no stored theme', () => {
      currentMediaQuery = 'dark';
      const { theme } = useTheme();

      expect(theme.value).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledWith('vrl-theme', 'dark');
    });

    it('should initialize with system theme (light) when no stored theme', () => {
      currentMediaQuery = 'light';
      const { theme } = useTheme();

      expect(theme.value).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(localStorage.setItem).toHaveBeenCalledWith('vrl-theme', 'light');
    });

    it('should initialize with stored theme over system preference', () => {
      currentMediaQuery = 'light'; // System prefers light
      localStorageMock['vrl-theme'] = 'dark'; // But stored preference is dark

      const { theme } = useTheme();

      expect(theme.value).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should only initialize once when called multiple times', () => {
      const { theme: theme1 } = useTheme();
      const { theme: theme2 } = useTheme();
      const { theme: theme3 } = useTheme();

      // All should reference the same reactive state
      expect(theme1.value).toBe(theme2.value);
      expect(theme2.value).toBe(theme3.value);

      // localStorage.setItem should only be called once during initialization
      expect(localStorage.setItem).toHaveBeenCalledTimes(1);
    });

    it('should register media query listener only once', () => {
      useTheme();
      useTheme();
      useTheme();

      // Should only have one listener registered
      expect(mediaQueryListeners.size).toBe(1);
    });
  });

  describe('setTheme', () => {
    it('should set theme to dark', () => {
      const { setTheme, theme } = useTheme();

      setTheme('dark');

      expect(theme.value).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(localStorage.getItem('vrl-theme')).toBe('dark');
    });

    it('should set theme to light', () => {
      const { setTheme, theme } = useTheme();

      setTheme('light');

      expect(theme.value).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(localStorage.getItem('vrl-theme')).toBe('light');
    });

    it('should update across all composable instances', () => {
      const { theme: theme1, setTheme } = useTheme();
      const { theme: theme2 } = useTheme();

      setTheme('light');

      expect(theme1.value).toBe('light');
      expect(theme2.value).toBe('light');
    });
  });

  describe('toggleTheme', () => {
    it('should toggle from dark to light', () => {
      const { toggleTheme, theme } = useTheme();

      // Assume we start with dark
      if (theme.value !== 'dark') {
        useTheme().setTheme('dark');
      }

      toggleTheme();

      expect(theme.value).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should toggle from light to dark', () => {
      const { toggleTheme, theme, setTheme } = useTheme();

      setTheme('light');
      toggleTheme();

      expect(theme.value).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should toggle multiple times correctly', () => {
      const { toggleTheme, theme } = useTheme();

      const initialTheme = theme.value;
      const expectedTheme: Theme = initialTheme === 'dark' ? 'light' : 'dark';

      toggleTheme();
      expect(theme.value).toBe(expectedTheme);

      toggleTheme();
      expect(theme.value).toBe(initialTheme);

      toggleTheme();
      expect(theme.value).toBe(expectedTheme);
    });
  });

  describe('system theme changes', () => {
    it('should respond to system theme changes when no user preference is stored', async () => {
      // Start with dark theme, no stored preference
      currentMediaQuery = 'dark';
      delete localStorageMock['vrl-theme'];

      const { theme } = useTheme();
      expect(theme.value).toBe('dark');

      // Clear the initial localStorage call
      vi.clearAllMocks();
      delete localStorageMock['vrl-theme'];

      // Simulate system theme change to light
      currentMediaQuery = 'light';
      const listener = mediaQueryListeners.get('(prefers-color-scheme: light)');
      expect(listener).toBeDefined();

      if (listener) {
        listener({
          matches: true,
          media: '(prefers-color-scheme: light)',
        } as MediaQueryListEvent);
      }

      await nextTick();

      expect(theme.value).toBe('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('should NOT respond to system theme changes when user has set a preference', async () => {
      // User has explicitly set dark theme
      localStorageMock['vrl-theme'] = 'dark';

      const { theme } = useTheme();
      expect(theme.value).toBe('dark');

      // Simulate system theme change to light
      currentMediaQuery = 'light';
      const listener = mediaQueryListeners.get('(prefers-color-scheme: light)');

      if (listener) {
        listener({
          matches: true,
          media: '(prefers-color-scheme: light)',
        } as MediaQueryListEvent);
      }

      await nextTick();

      // Should remain dark because user has a stored preference
      expect(theme.value).toBe('dark');
    });
  });

  describe('readonly theme', () => {
    it('should return readonly theme ref', () => {
      const { theme } = useTheme();

      // This should work in TypeScript but not allow direct assignment
      expect(theme.value).toBeDefined();

      // Attempting to assign should fail in TypeScript (we can't test this in JS runtime)
      // but we can verify the readonly wrapper exists
      expect(Object.getOwnPropertyDescriptor(theme, 'value')?.set).toBeUndefined();
    });

    it('should allow reading theme value multiple times', () => {
      const { theme } = useTheme();

      const value1 = theme.value;
      const value2 = theme.value;
      const value3 = theme.value;

      expect(value1).toBe(value2);
      expect(value2).toBe(value3);
    });
  });

  describe('DOM manipulation', () => {
    it('should set data-theme attribute correctly', () => {
      const { setTheme } = useTheme();

      setTheme('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

      setTheme('light');
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('should manage dark class correctly', () => {
      const { setTheme } = useTheme();

      setTheme('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      setTheme('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);

      setTheme('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('localStorage persistence', () => {
    it('should persist theme changes to localStorage', () => {
      const { setTheme } = useTheme();

      setTheme('dark');
      expect(localStorage.getItem('vrl-theme')).toBe('dark');

      setTheme('light');
      expect(localStorage.getItem('vrl-theme')).toBe('light');
    });

    it('should read from localStorage on initialization', () => {
      localStorageMock['vrl-theme'] = 'light';

      const { theme } = useTheme();

      expect(theme.value).toBe('light');
    });

    it('should ignore invalid localStorage values', () => {
      localStorageMock['vrl-theme'] = 'invalid-theme';
      currentMediaQuery = 'dark';

      const { theme } = useTheme();

      // Should fall back to system theme
      expect(theme.value).toBe('dark');
    });
  });
});
