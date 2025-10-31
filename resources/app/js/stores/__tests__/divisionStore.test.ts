import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useDivisionStore } from '../divisionStore';
import type { Division } from '@app/types/division';
import * as divisionService from '@app/services/divisionService';

// Mock the division service
vi.mock('@app/services/divisionService');

describe('divisionStore', () => {
  let store: ReturnType<typeof useDivisionStore>;

  const mockDivision: Division = {
    id: 1,
    season_id: 1,
    name: 'Pro Division',
    description: 'Professional drivers division',
    logo_url: 'https://example.com/logo.png',
    created_at: '2024-01-01T00:00:00.000000Z',
    updated_at: '2024-01-01T00:00:00.000000Z',
  };

  const mockDivisions: Division[] = [
    mockDivision,
    {
      id: 2,
      season_id: 1,
      name: 'Amateur Division',
      description: null,
      logo_url: null,
      created_at: '2024-01-01T00:00:00.000000Z',
      updated_at: '2024-01-01T00:00:00.000000Z',
    },
  ];

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useDivisionStore();
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('initializes with empty state', () => {
      expect(store.divisions).toEqual([]);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  describe('Getters', () => {
    beforeEach(() => {
      store.divisions = mockDivisions;
    });

    it('getDivisionById returns correct division', () => {
      const division = store.getDivisionById(1);
      expect(division).toEqual(mockDivision);
    });

    it('getDivisionById returns undefined for non-existent division', () => {
      const division = store.getDivisionById(999);
      expect(division).toBeUndefined();
    });

    it('getDivisionsBySeasonId filters divisions by season', () => {
      const divisions = store.getDivisionsBySeasonId(1);
      expect(divisions).toHaveLength(2);
    });

    it('divisionCount returns correct count', () => {
      expect(store.divisionCount).toBe(2);
    });

    it('hasDivisions returns true when divisions exist', () => {
      expect(store.hasDivisions).toBe(true);
    });

    it('hasDivisions returns false when no divisions', () => {
      store.divisions = [];
      expect(store.hasDivisions).toBe(false);
    });
  });

  describe('Actions', () => {
    describe('fetchDivisions', () => {
      it('fetches divisions successfully', async () => {
        vi.mocked(divisionService.getDivisions).mockResolvedValue(mockDivisions);

        await store.fetchDivisions(1);

        expect(divisionService.getDivisions).toHaveBeenCalledWith(1);
        expect(store.divisions).toEqual(mockDivisions);
        expect(store.loading).toBe(false);
        expect(store.error).toBeNull();
      });

      it('sets loading state during fetch', async () => {
        vi.mocked(divisionService.getDivisions).mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve(mockDivisions), 100)),
        );

        const promise = store.fetchDivisions(1);
        expect(store.loading).toBe(true);

        await promise;
        expect(store.loading).toBe(false);
      });

      it('handles fetch error', async () => {
        const error = new Error('Failed to fetch divisions');
        vi.mocked(divisionService.getDivisions).mockRejectedValue(error);

        await expect(store.fetchDivisions(1)).rejects.toThrow('Failed to fetch divisions');

        expect(store.error).toBe('Failed to fetch divisions');
        expect(store.loading).toBe(false);
      });
    });

    describe('createDivision', () => {
      it('creates division successfully', async () => {
        const formData = new FormData();
        vi.mocked(divisionService.buildCreateDivisionFormData).mockReturnValue(formData);
        vi.mocked(divisionService.createDivision).mockResolvedValue(mockDivision);

        const result = await store.createDivision(1, {
          name: 'Pro Division',
          description: 'Professional drivers division',
        });

        expect(divisionService.buildCreateDivisionFormData).toHaveBeenCalledWith({
          name: 'Pro Division',
          description: 'Professional drivers division',
        });
        expect(divisionService.createDivision).toHaveBeenCalledWith(1, formData);
        expect(result).toEqual(mockDivision);
        expect(store.divisions).toContainEqual(mockDivision);
        expect(store.loading).toBe(false);
        expect(store.error).toBeNull();
      });

      it('handles create error', async () => {
        const error = new Error('Failed to create division');
        vi.mocked(divisionService.buildCreateDivisionFormData).mockReturnValue(new FormData());
        vi.mocked(divisionService.createDivision).mockRejectedValue(error);

        await expect(store.createDivision(1, { name: 'Test' })).rejects.toThrow(
          'Failed to create division',
        );

        expect(store.error).toBe('Failed to create division');
      });
    });

    describe('updateDivision', () => {
      beforeEach(() => {
        store.divisions = [...mockDivisions];
      });

      it('updates division successfully', async () => {
        const updatedDivision = { ...mockDivision, name: 'Pro Division Updated' };
        vi.mocked(divisionService.buildUpdateDivisionFormData).mockReturnValue(new FormData());
        vi.mocked(divisionService.updateDivision).mockResolvedValue(updatedDivision);

        const result = await store.updateDivision(1, 1, { name: 'Pro Division Updated' });

        expect(result).toEqual(updatedDivision);
        expect(store.divisions[0]).toEqual(updatedDivision);
        expect(store.error).toBeNull();
      });

      it('handles update error', async () => {
        const error = new Error('Failed to update division');
        vi.mocked(divisionService.buildUpdateDivisionFormData).mockReturnValue(new FormData());
        vi.mocked(divisionService.updateDivision).mockRejectedValue(error);

        await expect(store.updateDivision(1, 1, { name: 'Test' })).rejects.toThrow(
          'Failed to update division',
        );

        expect(store.error).toBe('Failed to update division');
      });
    });

    describe('deleteDivision', () => {
      beforeEach(() => {
        store.divisions = [...mockDivisions];
      });

      it('deletes division successfully', async () => {
        vi.mocked(divisionService.deleteDivision).mockResolvedValue();

        await store.deleteDivision(1, 1);

        expect(divisionService.deleteDivision).toHaveBeenCalledWith(1, 1);
        expect(store.divisions).not.toContainEqual(mockDivision);
        expect(store.divisions).toHaveLength(1);
        expect(store.error).toBeNull();
      });

      it('handles delete error', async () => {
        const error = new Error('Failed to delete division');
        vi.mocked(divisionService.deleteDivision).mockRejectedValue(error);

        await expect(store.deleteDivision(1, 1)).rejects.toThrow('Failed to delete division');

        expect(store.error).toBe('Failed to delete division');
        expect(store.divisions).toHaveLength(2); // Divisions unchanged
      });
    });

    describe('getDriverCount', () => {
      it('gets driver count successfully', async () => {
        vi.mocked(divisionService.getDriverCount).mockResolvedValue(5);

        const count = await store.getDriverCount(1, 1);

        expect(divisionService.getDriverCount).toHaveBeenCalledWith(1, 1);
        expect(count).toBe(5);
        expect(store.error).toBeNull();
      });

      it('handles driver count error', async () => {
        const error = new Error('Failed to get driver count');
        vi.mocked(divisionService.getDriverCount).mockRejectedValue(error);

        await expect(store.getDriverCount(1, 1)).rejects.toThrow('Failed to get driver count');

        expect(store.error).toBe('Failed to get driver count');
      });
    });

    describe('assignDriverDivision', () => {
      it('assigns driver to division successfully', async () => {
        vi.mocked(divisionService.assignDriverDivision).mockResolvedValue();

        await store.assignDriverDivision(1, 1, { division_id: 1 });

        expect(divisionService.assignDriverDivision).toHaveBeenCalledWith(1, 1, { division_id: 1 });
        expect(store.error).toBeNull();
      });

      it('handles assign error', async () => {
        const error = new Error('Failed to assign driver to division');
        vi.mocked(divisionService.assignDriverDivision).mockRejectedValue(error);

        await expect(store.assignDriverDivision(1, 1, { division_id: 1 })).rejects.toThrow(
          'Failed to assign driver to division',
        );

        expect(store.error).toBe('Failed to assign driver to division');
      });
    });
  });

  describe('Utility Methods', () => {
    it('clearError clears the error', () => {
      store.error = 'Some error';
      store.clearError();
      expect(store.error).toBeNull();
    });

    it('resetStore resets all state', () => {
      store.divisions = mockDivisions;
      store.loading = true;
      store.error = 'Some error';

      store.resetStore();

      expect(store.divisions).toEqual([]);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });
});
