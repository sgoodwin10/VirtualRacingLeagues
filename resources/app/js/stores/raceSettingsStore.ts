import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { PlatformRaceSettings } from '@app/types/race';
import { getRaceSettings } from '@app/services/raceSettingsService';

export const useRaceSettingsStore = defineStore('raceSettings', () => {
  // Cache settings by platform ID
  const settingsCache = ref<Map<number, PlatformRaceSettings>>(new Map());
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchRaceSettings(platformId: number): Promise<PlatformRaceSettings> {
    // Return cached if available
    if (settingsCache.value.has(platformId)) {
      return settingsCache.value.get(platformId)!;
    }

    loading.value = true;
    error.value = null;
    try {
      const settings = await getRaceSettings(platformId);
      settingsCache.value.set(platformId, settings);
      return settings;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load race settings';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function clearCache(): void {
    settingsCache.value.clear();
  }

  function $reset(): void {
    settingsCache.value.clear();
    loading.value = false;
    error.value = null;
  }

  return {
    settingsCache,
    loading,
    error,
    fetchRaceSettings,
    clearCache,
    $reset,
  };
});
