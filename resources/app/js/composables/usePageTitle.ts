import { watch } from 'vue';
import type { Ref } from 'vue';
import { getSiteConfig } from '@app/types/site-config';

/**
 * Composable for managing dynamic page titles in the app dashboard
 *
 * @param title - Reactive reference to the page title parts (can be string or array of strings)
 * @returns Object with setTitle method for manual title updates
 *
 * @example
 * // Simple usage with reactive title
 * const pageTitle = computed(() => league.value?.name);
 * usePageTitle(pageTitle);
 *
 * @example
 * // Multi-part title (will be joined with ' - ')
 * const pageTitle = computed(() => [season.value?.name, competition.value?.name, league.value?.name]);
 * usePageTitle(pageTitle);
 *
 * @example
 * // Manual title update
 * const { setTitle } = usePageTitle();
 * setTitle(['Season 2024', 'Formula Racing League']);
 */
export function usePageTitle(title?: Ref<string | string[] | null | undefined>) {
  // Get site name from site config with fallbacks
  const siteConfig = getSiteConfig();
  const siteName = siteConfig?.name || import.meta.env.VITE_APP_NAME || 'Your App';
  const appSuffix = siteName;

  /**
   * Formats the title parts into a complete page title
   */
  const formatTitle = (titleParts: string | string[] | null | undefined): string => {
    if (!titleParts) {
      return appSuffix;
    }

    const parts = Array.isArray(titleParts) ? titleParts : [titleParts];
    const filteredParts = parts.filter((part) => part && part.trim() !== '');

    if (filteredParts.length === 0) {
      return appSuffix;
    }

    return `${filteredParts.join(' - ')} - ${appSuffix}`;
  };

  /**
   * Updates the document title
   */
  const updateTitle = (newTitle: string | string[] | null | undefined) => {
    document.title = formatTitle(newTitle);
  };

  /**
   * Manually set the page title
   */
  const setTitle = (newTitle: string | string[]) => {
    updateTitle(newTitle);
  };

  // Watch for changes if a reactive title is provided
  if (title) {
    watch(
      title,
      (newTitle) => {
        updateTitle(newTitle);
      },
      { immediate: true },
    );
  }

  return {
    setTitle,
  };
}
