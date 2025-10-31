/**
 * Site Configuration Store
 * Manages global site configuration state for the user dashboard
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { SiteConfig } from '@app/types/siteConfig';
import { getSiteConfig } from '@app/services/siteConfigService';

export const useSiteConfigStore = defineStore('siteConfig', () => {
  // State
  const config = ref<SiteConfig | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const initialized = ref(false);

  // Getters
  const siteName = computed(() => config.value?.siteName ?? 'Virtual Racing Leagues');
  const siteDescription = computed(
    () => config.value?.siteDescription ?? 'Manage your racing leagues',
  );
  const googleAnalyticsId = computed(() => config.value?.googleAnalyticsId);
  const facebookPixelId = computed(() => config.value?.facebookPixelId);
  const logoUrl = computed(() => config.value?.logoUrl);
  const faviconUrl = computed(() => config.value?.faviconUrl);
  const supportEmail = computed(() => config.value?.supportEmail);
  const contactEmail = computed(() => config.value?.contactEmail);
  const registrationsEnabled = computed(() => config.value?.registrationsEnabled ?? true);
  const maintenanceMode = computed(() => config.value?.maintenanceMode ?? false);
  const maintenanceMessage = computed(
    () => config.value?.maintenanceMessage ?? 'Site is under maintenance. Please check back later.',
  );

  /**
   * Check if the store has been successfully initialized
   */
  const isReady = computed(() => initialized.value && !loading.value && error.value === null);

  /**
   * Get a custom configuration value by key
   * @param key - The configuration key
   * @param defaultValue - Default value if key doesn't exist
   */
  function getCustomConfig<T = unknown>(key: string, defaultValue?: T): T | undefined {
    if (!config.value?.custom) {
      return defaultValue;
    }
    return (config.value.custom[key] as T) ?? defaultValue;
  }

  // Actions

  /**
   * Fetch site configuration from the API
   * Will not refetch if already loaded unless force is true
   * @param force - Force refetch even if already loaded
   */
  async function fetchConfig(force = false): Promise<void> {
    // Don't refetch if already loaded unless forced
    if (initialized.value && !force) {
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      config.value = await getSiteConfig();
      initialized.value = true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load site configuration';
      error.value = errorMessage;
      // Don't throw - allow app to continue with defaults
      console.error('Site config error:', errorMessage);
    } finally {
      loading.value = false;
    }
  }

  /**
   * Refresh/reload site configuration from the API
   * Alias for fetchConfig(true)
   */
  async function refreshConfig(): Promise<void> {
    return fetchConfig(true);
  }

  /**
   * Clear error message
   */
  function clearError(): void {
    error.value = null;
  }

  /**
   * Reset store to initial state
   */
  function reset(): void {
    config.value = null;
    loading.value = false;
    error.value = null;
    initialized.value = false;
  }

  return {
    // State
    config,
    loading,
    error,
    initialized,

    // Getters
    siteName,
    siteDescription,
    googleAnalyticsId,
    facebookPixelId,
    logoUrl,
    faviconUrl,
    supportEmail,
    contactEmail,
    registrationsEnabled,
    maintenanceMode,
    maintenanceMessage,
    isReady,

    // Actions
    fetchConfig,
    refreshConfig,
    getCustomConfig,
    clearError,
    reset,
  };
});
