import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import type { PlatformRaceSettings } from '@app/types/race';
import { getRaceSettings } from '@app/services/raceSettingsService';

interface CachedSettings {
  data: PlatformRaceSettings;
  timestamp: number;
}

export const useRaceSettingsStore = defineStore('raceSettings', () => {
  // Cache settings by platform ID with TTL - reactive Map for proper reactivity
  const settingsCache = reactive(new Map<number, CachedSettings>());
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Cache TTL: 5 minutes (in milliseconds)
  const CACHE_TTL = 5 * 60 * 1000;

  /**
   * Check if cached entry is still valid
   */
  function isCacheValid(platformId: number): boolean {
    const cached = settingsCache.get(platformId);
    if (!cached) return false;

    const now = Date.now();
    return now - cached.timestamp < CACHE_TTL;
  }

  async function fetchRaceSettings(platformId: number): Promise<PlatformRaceSettings> {
    // Return cached if available and not expired
    if (isCacheValid(platformId)) {
      return settingsCache.get(platformId)!.data;
    }

    loading.value = true;
    error.value = null;
    try {
      const settings = await getRaceSettings(platformId);
      // Store with timestamp for TTL validation
      settingsCache.set(platformId, {
        data: settings,
        timestamp: Date.now(),
      });
      return settings;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load race settings';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Invalidate cache for a specific platform
   */
  function invalidateCache(platformId: number): void {
    settingsCache.delete(platformId);
  }

  /**
   * Clear all cached settings
   */
  function clearCache(): void {
    settingsCache.clear();
  }

  function $reset(): void {
    settingsCache.clear();
    loading.value = false;
    error.value = null;
  }

  return {
    settingsCache,
    loading,
    error,
    fetchRaceSettings,
    invalidateCache,
    clearCache,
    $reset,
  };
});
