import { ref, onMounted } from 'vue';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'vrl-theme';

// Shared state across all component instances
const theme = ref<Theme>('dark');

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
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem(STORAGE_KEY, newTheme);
}

export function useTheme() {
  const setTheme = (newTheme: Theme): void => {
    theme.value = newTheme;
    applyTheme(newTheme);
  };

  const toggleTheme = (): void => {
    const newTheme = theme.value === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  // Initialize theme on first use
  onMounted(() => {
    const stored = getStoredTheme();
    const initialTheme = stored ?? getSystemTheme();
    theme.value = initialTheme;
    applyTheme(initialTheme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only apply system preference if user hasn't set a preference
      if (!getStoredTheme()) {
        const systemTheme = e.matches ? 'light' : 'dark';
        theme.value = systemTheme;
        applyTheme(systemTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
  });

  return {
    theme,
    toggleTheme,
    setTheme,
  };
}
