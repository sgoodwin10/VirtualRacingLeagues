import { ref, readonly } from 'vue';
import type { Ref } from 'vue';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'vrl-theme';

// Shared state across all component instances
const theme = ref<Theme>('dark');

// Singleton initialization tracking
let isInitialized = false;
let mediaQuery: MediaQueryList | null = null;

// For testing purposes only - allows resetting the singleton state
export function __resetThemeForTesting(): void {
  isInitialized = false;
  mediaQuery = null;
  theme.value = 'dark';
  if (typeof document !== 'undefined') {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('dark');
  }
}

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return null;
}

function applyTheme(newTheme: Theme): void {
  if (typeof document === 'undefined') return;

  // Set data-theme attribute for our custom CSS variables
  document.documentElement.setAttribute('data-theme', newTheme);

  // Add/remove .dark class for PrimeVue compatibility
  if (newTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  localStorage.setItem(STORAGE_KEY, newTheme);
}

function initializeTheme(): void {
  if (isInitialized || typeof window === 'undefined') return;

  isInitialized = true;

  // Set initial theme
  const stored = getStoredTheme();
  const initialTheme = stored ?? getSystemTheme();
  theme.value = initialTheme;
  applyTheme(initialTheme);

  // Listen for system theme changes
  mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
  const handleChange = (e: MediaQueryListEvent) => {
    // Only apply system preference if user hasn't set a preference
    if (!getStoredTheme()) {
      const systemTheme = e.matches ? 'light' : 'dark';
      theme.value = systemTheme;
      applyTheme(systemTheme);
    }
  };

  mediaQuery.addEventListener('change', handleChange);
}

export function useTheme() {
  // Initialize only once at module level
  initializeTheme();

  const setTheme = (newTheme: Theme): void => {
    theme.value = newTheme;
    applyTheme(newTheme);
  };

  const toggleTheme = (): void => {
    const newTheme = theme.value === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  return {
    theme: readonly(theme) as Readonly<Ref<Theme>>,
    toggleTheme,
    setTheme,
  };
}
