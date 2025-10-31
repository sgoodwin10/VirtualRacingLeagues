import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useLeagueStore } from '../leagueStore';
import * as leagueService from '@app/services/leagueService';
import type { Platform, Timezone, League } from '@app/types/league';

// Mock the league service
vi.mock('@app/services/leagueService');

describe('leagueStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = useLeagueStore();

      expect(store.leagues).toEqual([]);
      expect(store.platforms).toEqual([]);
      expect(store.timezones).toEqual([]);
      expect(store.currentLeague).toBeNull();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.currentStep).toBe(0);
      expect(store.platformColumns).toEqual([]);
      expect(store.platformFormFields).toEqual([]);
      expect(store.platformCsvHeaders).toEqual([]);
    });
  });

  describe('getters', () => {
    it('hasReachedFreeLimit should return false when no leagues', () => {
      const store = useLeagueStore();
      expect(store.hasReachedFreeLimit).toBe(false);
    });

    it('hasReachedFreeLimit should return true when 1 league exists', () => {
      const store = useLeagueStore();
      store.leagues = [{ id: 1, name: 'Test League' } as League];
      expect(store.hasReachedFreeLimit).toBe(true);
    });

    it('leagueCount should return correct count', () => {
      const store = useLeagueStore();
      store.leagues = [
        { id: 1, name: 'League 1' } as League,
        { id: 2, name: 'League 2' } as League,
      ];
      expect(store.leagueCount).toBe(2);
    });
  });

  describe('fetchPlatforms', () => {
    it('should fetch platforms successfully', async () => {
      const mockPlatforms: Platform[] = [
        { id: 1, name: 'Gran Turismo 7', slug: 'gran-turismo-7' },
        { id: 2, name: 'iRacing', slug: 'iracing' },
      ];

      vi.mocked(leagueService.getPlatforms).mockResolvedValue(mockPlatforms);

      const store = useLeagueStore();
      await store.fetchPlatforms();

      expect(store.platforms).toEqual(mockPlatforms);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should not refetch platforms if already loaded', async () => {
      const mockPlatforms: Platform[] = [{ id: 1, name: 'Test', slug: 'test' }];

      const store = useLeagueStore();
      store.platforms = mockPlatforms;

      await store.fetchPlatforms();

      expect(leagueService.getPlatforms).not.toHaveBeenCalled();
    });

    it('should handle errors when fetching platforms', async () => {
      vi.mocked(leagueService.getPlatforms).mockRejectedValue(new Error('Network error'));

      const store = useLeagueStore();

      await expect(store.fetchPlatforms()).rejects.toThrow('Network error');
      expect(store.error).toBe('Network error');
      expect(store.loading).toBe(false);
    });
  });

  describe('fetchTimezones', () => {
    it('should fetch timezones successfully', async () => {
      const mockTimezones: Timezone[] = [
        { value: 'UTC', label: 'UTC' },
        { value: 'America/New_York', label: 'Eastern Time' },
      ];

      vi.mocked(leagueService.getTimezones).mockResolvedValue(mockTimezones);

      const store = useLeagueStore();
      await store.fetchTimezones();

      expect(store.timezones).toEqual(mockTimezones);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  describe('checkSlug', () => {
    it('should return availability info for available slug', async () => {
      vi.mocked(leagueService.checkSlugAvailability).mockResolvedValue({
        available: true,
        slug: 'test-league',
        suggestion: null,
      });

      const store = useLeagueStore();
      const result = await store.checkSlug('Test League');

      expect(result).toEqual({
        available: true,
        slug: 'test-league',
        suggestion: null,
      });
    });

    it('should return availability info with suggestion for unavailable slug', async () => {
      vi.mocked(leagueService.checkSlugAvailability).mockResolvedValue({
        available: false,
        slug: 'test-league',
        suggestion: 'test-league-01',
      });

      const store = useLeagueStore();
      const result = await store.checkSlug('Test League');

      expect(result).toEqual({
        available: false,
        slug: 'test-league',
        suggestion: 'test-league-01',
      });
    });

    it('should return unavailable for empty name', async () => {
      const store = useLeagueStore();
      const result = await store.checkSlug('');

      expect(result).toEqual({
        available: false,
        slug: '',
        suggestion: null,
      });
      expect(leagueService.checkSlugAvailability).not.toHaveBeenCalled();
    });
  });

  describe('createNewLeague', () => {
    it('should create league successfully', async () => {
      const mockLeague: League = {
        id: 1,
        name: 'Test League',
        slug: 'test-league',
        visibility: 'public',
        timezone: 'UTC',
      } as League;

      vi.mocked(leagueService.createLeague).mockResolvedValue(mockLeague);
      vi.mocked(leagueService.buildLeagueFormData).mockReturnValue(new FormData());

      const store = useLeagueStore();
      const form = {
        name: 'Test League',
        timezone: 'UTC',
        visibility: 'public',
      } as any;

      const result = await store.createNewLeague(form);

      expect(result).toEqual(mockLeague);
      expect(store.leagues).toHaveLength(1);
      expect(store.leagues[0]).toEqual(mockLeague);
      expect(store.currentLeague).toEqual(mockLeague);
    });
  });

  describe('fetchLeagues', () => {
    it('should fetch user leagues successfully', async () => {
      const mockLeagues: League[] = [
        { id: 1, name: 'League 1' } as League,
        { id: 2, name: 'League 2' } as League,
      ];

      vi.mocked(leagueService.getUserLeagues).mockResolvedValue(mockLeagues);

      const store = useLeagueStore();
      await store.fetchLeagues();

      expect(store.leagues).toEqual(mockLeagues);
      expect(store.loading).toBe(false);
    });
  });

  describe('removeLeague', () => {
    it('should delete league successfully', async () => {
      vi.mocked(leagueService.deleteLeague).mockResolvedValue();

      const store = useLeagueStore();
      store.leagues = [
        { id: 1, name: 'League 1' } as League,
        { id: 2, name: 'League 2' } as League,
      ];

      await store.removeLeague(1);

      expect(store.leagues).toHaveLength(1);
      expect(store.leagues[0]?.id).toBe(2);
    });

    it('should clear currentLeague if it was deleted', async () => {
      vi.mocked(leagueService.deleteLeague).mockResolvedValue();

      const store = useLeagueStore();
      store.currentLeague = { id: 1, name: 'League 1' } as League;
      store.leagues = [{ id: 1, name: 'League 1' } as League];

      await store.removeLeague(1);

      expect(store.currentLeague).toBeNull();
    });
  });

  describe('updateExistingLeague', () => {
    it('should update league successfully', async () => {
      const originalLeague: League = {
        id: 1,
        name: 'Original League',
      } as League;

      const updatedLeague: League = {
        id: 1,
        name: 'Updated League',
      } as League;

      vi.mocked(leagueService.buildUpdateLeagueFormData).mockReturnValue(new FormData());
      vi.mocked(leagueService.updateLeague).mockResolvedValue(updatedLeague);

      const store = useLeagueStore();
      store.leagues = [originalLeague];

      const result = await store.updateExistingLeague(1, { name: 'Updated League' });

      expect(result).toEqual(updatedLeague);
      expect(store.leagues[0]).toEqual(updatedLeague);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should update currentLeague if it was the one being edited', async () => {
      const originalLeague: League = {
        id: 1,
        name: 'Original League',
      } as League;

      const updatedLeague: League = {
        id: 1,
        name: 'Updated League',
      } as League;

      vi.mocked(leagueService.buildUpdateLeagueFormData).mockReturnValue(new FormData());
      vi.mocked(leagueService.updateLeague).mockResolvedValue(updatedLeague);

      const store = useLeagueStore();
      store.leagues = [originalLeague];
      store.currentLeague = originalLeague;

      await store.updateExistingLeague(1, { name: 'Updated League' });

      expect(store.currentLeague).toEqual(updatedLeague);
    });

    it('should throw error if league not found', async () => {
      const store = useLeagueStore();
      store.leagues = [];

      await expect(store.updateExistingLeague(1, { name: 'Updated' })).rejects.toThrow(
        'League not found',
      );
    });

    it('should handle errors when updating league', async () => {
      const originalLeague: League = {
        id: 1,
        name: 'Original League',
      } as League;

      vi.mocked(leagueService.buildUpdateLeagueFormData).mockReturnValue(new FormData());
      vi.mocked(leagueService.updateLeague).mockRejectedValue(new Error('Update failed'));

      const store = useLeagueStore();
      store.leagues = [originalLeague];

      await expect(store.updateExistingLeague(1, { name: 'Updated' })).rejects.toThrow(
        'Update failed',
      );
      expect(store.error).toBe('Update failed');
      expect(store.loading).toBe(false);
    });
  });

  describe('wizard step management', () => {
    it('should set current step', () => {
      const store = useLeagueStore();
      store.setCurrentStep(2);
      expect(store.currentStep).toBe(2);
    });

    it('should reset wizard', () => {
      const store = useLeagueStore();
      store.currentStep = 2;
      store.resetWizard();
      expect(store.currentStep).toBe(0);
    });
  });

  describe('clearError', () => {
    it('should clear error message', () => {
      const store = useLeagueStore();
      store.error = 'Test error';
      store.clearError();
      expect(store.error).toBeNull();
    });
  });

  describe('fetchDriverColumnsForLeague', () => {
    it('should fetch driver columns successfully', async () => {
      const mockColumns = [
        { field: 'psn_id', label: 'PSN ID', type: 'text' as const },
        { field: 'iracing_id', label: 'iRacing ID', type: 'text' as const },
      ];

      vi.mocked(leagueService.getDriverColumns).mockResolvedValue(mockColumns);

      const store = useLeagueStore();
      await store.fetchDriverColumnsForLeague(1);

      expect(store.platformColumns).toEqual(mockColumns);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(leagueService.getDriverColumns).toHaveBeenCalledWith(1);
    });

    it('should handle errors when fetching driver columns', async () => {
      vi.mocked(leagueService.getDriverColumns).mockRejectedValue(new Error('Network error'));

      const store = useLeagueStore();

      await expect(store.fetchDriverColumnsForLeague(1)).rejects.toThrow('Network error');
      expect(store.error).toBe('Network error');
      expect(store.loading).toBe(false);
    });
  });

  describe('fetchDriverFormFieldsForLeague', () => {
    it('should fetch driver form fields successfully', async () => {
      const mockFormFields = [
        {
          field: 'psn_id',
          label: 'PSN ID',
          type: 'text' as const,
          placeholder: 'Enter PSN ID',
        },
        {
          field: 'iracing_customer_id',
          label: 'iRacing Customer ID',
          type: 'number' as const,
          placeholder: '123456',
        },
      ];

      vi.mocked(leagueService.getDriverFormFields).mockResolvedValue(mockFormFields);

      const store = useLeagueStore();
      await store.fetchDriverFormFieldsForLeague(1);

      expect(store.platformFormFields).toEqual(mockFormFields);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(leagueService.getDriverFormFields).toHaveBeenCalledWith(1);
    });

    it('should handle errors when fetching driver form fields', async () => {
      vi.mocked(leagueService.getDriverFormFields).mockRejectedValue(new Error('Network error'));

      const store = useLeagueStore();

      await expect(store.fetchDriverFormFieldsForLeague(1)).rejects.toThrow('Network error');
      expect(store.error).toBe('Network error');
      expect(store.loading).toBe(false);
    });
  });

  describe('fetchDriverCsvHeadersForLeague', () => {
    it('should fetch CSV headers successfully', async () => {
      const mockHeaders = [
        { field: 'FirstName', label: 'First Name', type: 'text' as const },
        { field: 'LastName', label: 'Last Name', type: 'text' as const },
        { field: 'Email', label: 'Email', type: 'text' as const },
        { field: 'PSN_ID', label: 'PSN ID', type: 'text' as const },
        { field: 'iRacing_ID', label: 'iRacing ID', type: 'text' as const },
        { field: 'DriverNumber', label: 'Driver Number', type: 'number' as const },
      ];

      vi.mocked(leagueService.getDriverCsvHeaders).mockResolvedValue(mockHeaders);

      const store = useLeagueStore();
      await store.fetchDriverCsvHeadersForLeague(1);

      expect(store.platformCsvHeaders).toEqual(mockHeaders);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(leagueService.getDriverCsvHeaders).toHaveBeenCalledWith(1);
    });

    it('should handle errors when fetching CSV headers', async () => {
      vi.mocked(leagueService.getDriverCsvHeaders).mockRejectedValue(new Error('Network error'));

      const store = useLeagueStore();

      await expect(store.fetchDriverCsvHeadersForLeague(1)).rejects.toThrow('Network error');
      expect(store.error).toBe('Network error');
      expect(store.loading).toBe(false);
    });
  });
});
