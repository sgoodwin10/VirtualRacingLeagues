import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useRaceSettingsStore } from '../raceSettingsStore';
import * as raceSettingsService from '@app/services/raceSettingsService';
import type { PlatformRaceSettings } from '@app/types/race';

vi.mock('@app/services/raceSettingsService');

describe('raceSettingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  const mockSettings: PlatformRaceSettings = {
    weather_conditions: [
      { value: 'clear', label: 'Clear' },
      { value: 'cloudy', label: 'Cloudy' },
      { value: 'rain', label: 'Rain' },
    ],
    tire_restrictions: [
      { value: 'none', label: 'No Restrictions' },
      { value: 'soft_only', label: 'Soft Only' },
    ],
    fuel_usage: [
      { value: 'standard', label: 'Standard' },
      { value: 'double', label: 'Double' },
    ],
    damage_model: [
      { value: 'off', label: 'Off' },
      { value: 'realistic', label: 'Realistic' },
    ],
    assists_restrictions: [
      { value: 'none', label: 'No Restrictions' },
      { value: 'limited', label: 'Limited' },
    ],
  };

  describe('fetchRaceSettings', () => {
    it('should fetch race settings for a platform', async () => {
      const store = useRaceSettingsStore();
      vi.mocked(raceSettingsService.getRaceSettings).mockResolvedValue(mockSettings);

      const result = await store.fetchRaceSettings(1);

      expect(raceSettingsService.getRaceSettings).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockSettings);
      expect(store.settingsCache.has(1)).toBe(true);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should return cached settings if available', async () => {
      const store = useRaceSettingsStore();
      store.settingsCache.set(1, mockSettings);

      const result = await store.fetchRaceSettings(1);

      expect(raceSettingsService.getRaceSettings).not.toHaveBeenCalled();
      expect(result).toEqual(mockSettings);
    });

    it('should handle fetch error', async () => {
      const store = useRaceSettingsStore();
      const error = new Error('Fetch failed');
      vi.mocked(raceSettingsService.getRaceSettings).mockRejectedValue(error);

      await expect(store.fetchRaceSettings(1)).rejects.toThrow('Fetch failed');
      expect(store.error).toBe('Fetch failed');
      expect(store.loading).toBe(false);
    });

    it('should cache settings for different platforms', async () => {
      const store = useRaceSettingsStore();
      const settings2 = { ...mockSettings };

      vi.mocked(raceSettingsService.getRaceSettings)
        .mockResolvedValueOnce(mockSettings)
        .mockResolvedValueOnce(settings2);

      await store.fetchRaceSettings(1);
      await store.fetchRaceSettings(2);

      expect(raceSettingsService.getRaceSettings).toHaveBeenCalledTimes(2);
      expect(store.settingsCache.has(1)).toBe(true);
      expect(store.settingsCache.has(2)).toBe(true);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached settings', () => {
      const store = useRaceSettingsStore();
      store.settingsCache.set(1, mockSettings);
      store.settingsCache.set(2, mockSettings);

      store.clearCache();

      expect(store.settingsCache.size).toBe(0);
    });
  });

  describe('$reset', () => {
    it('should reset store to initial state', () => {
      const store = useRaceSettingsStore();
      store.settingsCache.set(1, mockSettings);
      store.loading = true;
      store.error = 'Test error';

      store.$reset();

      expect(store.settingsCache.size).toBe(0);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });
});
