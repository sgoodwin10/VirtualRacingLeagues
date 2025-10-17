import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { SiteConfig } from '@admin/types/siteConfig';
import { siteConfigService } from '@admin/services/siteConfigService';
import { logger } from '@admin/utils/logger';

/**
 * Site Configuration Store
 * Manages global site configuration data
 */
export const useSiteConfigStore = defineStore('siteConfig', () => {
  // State
  const config = ref<SiteConfig | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const siteName = computed(() => config.value?.site_name ?? 'Admin Panel');
  const logo = computed(() => config.value?.files?.logo ?? null);
  const favicon = computed(() => config.value?.files?.favicon ?? null);
  const ogImage = computed(() => config.value?.files?.og_image ?? null);
  const maintenanceMode = computed(() => config.value?.maintenance_mode ?? false);
  const timezone = computed(() => config.value?.timezone ?? 'UTC');
  const userRegistrationEnabled = computed(() => config.value?.user_registration_enabled ?? false);

  // Actions
  /**
   * Fetch site configuration from API
   */
  async function fetchSiteConfig(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const data = await siteConfigService.getSiteConfig();
      config.value = data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch site configuration';
      logger.error('Failed to fetch site configuration:', err);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Update site configuration
   * Used after successful update to refresh the store
   */
  function updateConfig(newConfig: SiteConfig): void {
    config.value = newConfig;
  }

  /**
   * Clear site configuration
   */
  function clearConfig(): void {
    config.value = null;
    error.value = null;
  }

  return {
    // State
    config,
    isLoading,
    error,

    // Getters
    siteName,
    logo,
    favicon,
    ogImage,
    maintenanceMode,
    timezone,
    userRegistrationEnabled,

    // Actions
    fetchSiteConfig,
    updateConfig,
    clearConfig,
  };
});
