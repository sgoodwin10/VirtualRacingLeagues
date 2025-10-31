import { computed, ref } from 'vue';
import type { Ref, ComputedRef } from 'vue';

/**
 * Composable for handling image URLs with normalization, error handling, and loading states
 *
 * @param imageUrl - The image URL from the backend (can be full URL, relative path, or null)
 * @param fallbackUrl - Optional fallback URL to use if image fails to load
 * @returns Object containing normalized URL, loading state, error state, and event handlers
 *
 * @example
 * const { url, isLoading, hasError, handleLoad, handleError } = useImageUrl(
 *   () => props.league.logo_url,
 *   '/images/default-logo.png'
 * );
 */
export function useImageUrl(
  imageUrl: Ref<string | null | undefined> | (() => string | null | undefined),
  fallbackUrl?: string,
) {
  const isLoading = ref(true);
  const hasError = ref(false);

  /**
   * Normalizes image URLs to handle both full URLs and relative paths
   * - Full URLs (starting with http/https) are returned as-is
   * - Relative URLs starting with /storage/ are prefixed with current origin
   * - Other paths are returned as-is
   */
  const url: ComputedRef<string> = computed(() => {
    const rawUrl = typeof imageUrl === 'function' ? imageUrl() : imageUrl.value;

    if (!rawUrl) {
      return fallbackUrl || '';
    }

    // If the URL is already a full URL (with protocol), return it as is
    if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
      return rawUrl;
    }

    // For relative URLs starting with /storage/, use the current domain
    // This ensures images work across all subdomains (public, app, admin)
    if (rawUrl.startsWith('/storage/')) {
      const currentOrigin = window.location.origin;
      return `${currentOrigin}${rawUrl}`;
    }

    // For other relative paths, return as-is
    return rawUrl;
  });

  /**
   * Display URL - returns fallback if error occurred, otherwise returns normalized URL
   */
  const displayUrl: ComputedRef<string> = computed(() => {
    if (hasError.value && fallbackUrl) {
      return fallbackUrl;
    }
    return url.value;
  });

  /**
   * Handle successful image load
   */
  function handleLoad(): void {
    isLoading.value = false;
    hasError.value = false;
  }

  /**
   * Handle image load error
   */
  function handleError(): void {
    isLoading.value = false;
    hasError.value = true;
  }

  /**
   * Reset loading and error states
   * Useful when the image URL changes
   */
  function reset(): void {
    isLoading.value = true;
    hasError.value = false;
  }

  return {
    /** The normalized URL (full URL or relative path with origin) */
    url,
    /** The URL to display (returns fallback if error occurred) */
    displayUrl,
    /** Whether the image is currently loading */
    isLoading,
    /** Whether the image failed to load */
    hasError,
    /** Handler for image load event */
    handleLoad,
    /** Handler for image error event */
    handleError,
    /** Reset loading and error states */
    reset,
  };
}
