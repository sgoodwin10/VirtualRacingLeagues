import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCompetitionStore } from '../competitionStore';
import * as competitionService from '@app/services/competitionService';
import type { Competition, CompetitionForm } from '@app/types/competition';

// Mock the competition service
vi.mock('@app/services/competitionService');

describe('competitionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  const mockCompetition: Competition = {
    id: 1,
    league_id: 1,
    name: 'GT3 Championship',
    slug: 'gt3-championship',
    description: 'A competitive GT3 racing series',
    platform_id: 1,
    platform_name: 'iRacing',
    platform_slug: 'iracing',
    platform: {
      id: 1,
      name: 'iRacing',
      slug: 'iracing',
    },
    logo_url: 'https://example.com/logo.png',
    has_own_logo: true,
    competition_colour: null,
    status: 'active',
    is_active: true,
    is_archived: false,
    is_deleted: false,
    archived_at: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    deleted_at: null,
    created_by_user_id: 1,
    stats: {
      total_seasons: 2,
      active_seasons: 1,
      total_rounds: 10,
      total_drivers: 20,
      total_races: 15,
      next_race_date: '2025-02-01T00:00:00Z',
    },
  };

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = useCompetitionStore();

      expect(store.competitions).toEqual([]);
      expect(store.currentCompetition).toBeNull();
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  describe('getters', () => {
    const mockCompetitions: Competition[] = [
      { ...mockCompetition, id: 1, is_active: true, is_archived: false },
      {
        ...mockCompetition,
        id: 2,
        name: 'GT4 Championship',
        is_active: false,
        is_archived: true,
      },
      { ...mockCompetition, id: 3, platform_id: 2, is_active: true, is_archived: false },
    ];

    it('activeCompetitions should return only active competitions', () => {
      const store = useCompetitionStore();
      store.competitions = mockCompetitions;

      expect(store.activeCompetitions).toHaveLength(2);
      expect(store.activeCompetitions.every((c) => c.is_active)).toBe(true);
    });

    it('archivedCompetitions should return only archived competitions', () => {
      const store = useCompetitionStore();
      store.competitions = mockCompetitions;

      expect(store.archivedCompetitions).toHaveLength(1);
      expect(store.archivedCompetitions[0]?.is_archived).toBe(true);
    });

    it('competitionsByPlatform should group competitions by platform', () => {
      const store = useCompetitionStore();
      store.competitions = mockCompetitions;

      const grouped = store.competitionsByPlatform;

      expect(Object.keys(grouped)).toHaveLength(2);
      expect(grouped[1]).toHaveLength(2);
      expect(grouped[2]).toHaveLength(1);
    });
  });

  describe('fetchCompetitions', () => {
    it('should fetch competitions successfully', async () => {
      const competitions = [mockCompetition];
      vi.mocked(competitionService.getLeagueCompetitions).mockResolvedValue(competitions);

      const store = useCompetitionStore();
      await store.fetchCompetitions(1);

      expect(store.competitions).toEqual(competitions);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should fetch competitions with filters', async () => {
      const filters = { status: 'active' as const, platform_id: 1 };
      vi.mocked(competitionService.getLeagueCompetitions).mockResolvedValue([mockCompetition]);

      const store = useCompetitionStore();
      await store.fetchCompetitions(1, filters);

      expect(competitionService.getLeagueCompetitions).toHaveBeenCalledWith(1, filters);
    });

    it('should handle fetch error', async () => {
      const errorMessage = 'Failed to fetch';
      vi.mocked(competitionService.getLeagueCompetitions).mockRejectedValue(
        new Error(errorMessage),
      );

      const store = useCompetitionStore();

      await expect(store.fetchCompetitions(1)).rejects.toThrow(errorMessage);
      expect(store.error).toBe(errorMessage);
      expect(store.loading).toBe(false);
    });
  });

  describe('fetchCompetition', () => {
    it('should fetch a single competition', async () => {
      vi.mocked(competitionService.getCompetition).mockResolvedValue(mockCompetition);

      const store = useCompetitionStore();
      const result = await store.fetchCompetition(1);

      expect(store.currentCompetition).toEqual(mockCompetition);
      expect(result).toEqual(mockCompetition);
      expect(store.loading).toBe(false);
    });

    it('should handle fetch error', async () => {
      const errorMessage = 'Competition not found';
      vi.mocked(competitionService.getCompetition).mockRejectedValue(new Error(errorMessage));

      const store = useCompetitionStore();

      await expect(store.fetchCompetition(1)).rejects.toThrow(errorMessage);
      expect(store.error).toBe(errorMessage);
    });
  });

  describe('createNewCompetition', () => {
    it('should create a new competition', async () => {
      const form: CompetitionForm = {
        name: 'GT3 Championship',
        description: 'A competitive GT3 racing series',
        platform_id: 1,
        logo: null,
        logo_url: null,
        competition_colour: null,
      };

      vi.mocked(competitionService.buildCompetitionFormData).mockReturnValue(new FormData());
      vi.mocked(competitionService.createCompetition).mockResolvedValue(mockCompetition);

      const store = useCompetitionStore();
      const result = await store.createNewCompetition(1, form);

      expect(result).toEqual(mockCompetition);
      expect(store.competitions).toHaveLength(1);
      expect(store.competitions[0]).toEqual(mockCompetition);
      expect(store.currentCompetition).toEqual(mockCompetition);
      expect(store.loading).toBe(false);
    });

    it('should throw error if platform_id is null', async () => {
      const form: CompetitionForm = {
        name: 'GT3 Championship',
        description: '',
        platform_id: null,
        logo: null,
        logo_url: null,
        competition_colour: null,
      };

      const store = useCompetitionStore();

      await expect(store.createNewCompetition(1, form)).rejects.toThrow('Platform is required');
    });

    it('should handle create error', async () => {
      const form: CompetitionForm = {
        name: 'GT3 Championship',
        description: '',
        platform_id: 1,
        logo: null,
        logo_url: null,
        competition_colour: null,
      };

      const errorMessage = 'Creation failed';
      vi.mocked(competitionService.buildCompetitionFormData).mockReturnValue(new FormData());
      vi.mocked(competitionService.createCompetition).mockRejectedValue(new Error(errorMessage));

      const store = useCompetitionStore();

      await expect(store.createNewCompetition(1, form)).rejects.toThrow(errorMessage);
      expect(store.error).toBe(errorMessage);
    });
  });

  describe('updateExistingCompetition', () => {
    it('should update an existing competition', async () => {
      const updatedCompetition = { ...mockCompetition, name: 'Updated GT3 Championship' };

      vi.mocked(competitionService.buildUpdateCompetitionFormData).mockReturnValue(new FormData());
      vi.mocked(competitionService.updateCompetition).mockResolvedValue(updatedCompetition);

      const store = useCompetitionStore();
      store.competitions = [mockCompetition];
      store.currentCompetition = mockCompetition;

      const result = await store.updateExistingCompetition(1, { name: 'Updated GT3 Championship' });

      expect(result).toEqual(updatedCompetition);
      expect(store.competitions[0]).toEqual(updatedCompetition);
      expect(store.currentCompetition).toEqual(updatedCompetition);
      expect(store.loading).toBe(false);
    });

    it('should handle update error', async () => {
      const errorMessage = 'Update failed';
      vi.mocked(competitionService.buildUpdateCompetitionFormData).mockReturnValue(new FormData());
      vi.mocked(competitionService.updateCompetition).mockRejectedValue(new Error(errorMessage));

      const store = useCompetitionStore();

      await expect(store.updateExistingCompetition(1, { name: 'Updated' })).rejects.toThrow(
        errorMessage,
      );
      expect(store.error).toBe(errorMessage);
    });
  });

  describe('archiveExistingCompetition', () => {
    it('should archive a competition', async () => {
      vi.mocked(competitionService.archiveCompetition).mockResolvedValue();

      const store = useCompetitionStore();
      store.competitions = [mockCompetition];
      store.currentCompetition = mockCompetition;

      await store.archiveExistingCompetition(1);

      expect(store.competitions[0]?.is_archived).toBe(true);
      expect(store.competitions[0]?.is_active).toBe(false);
      expect(store.competitions[0]?.status).toBe('archived');
      expect(store.currentCompetition?.is_archived).toBe(true);
      expect(store.loading).toBe(false);
    });

    it('should handle archive error', async () => {
      const errorMessage = 'Archive failed';
      vi.mocked(competitionService.archiveCompetition).mockRejectedValue(new Error(errorMessage));

      const store = useCompetitionStore();

      await expect(store.archiveExistingCompetition(1)).rejects.toThrow(errorMessage);
      expect(store.error).toBe(errorMessage);
    });
  });

  describe('deleteExistingCompetition', () => {
    it('should delete a competition', async () => {
      vi.mocked(competitionService.deleteCompetition).mockResolvedValue();

      const store = useCompetitionStore();
      store.competitions = [mockCompetition, { ...mockCompetition, id: 2 }];
      store.currentCompetition = mockCompetition;

      await store.deleteExistingCompetition(1);

      expect(store.competitions).toHaveLength(1);
      expect(store.competitions[0]?.id).toBe(2);
      expect(store.currentCompetition).toBeNull();
      expect(store.loading).toBe(false);
    });

    it('should handle delete error', async () => {
      const errorMessage = 'Delete failed';
      vi.mocked(competitionService.deleteCompetition).mockRejectedValue(new Error(errorMessage));

      const store = useCompetitionStore();

      await expect(store.deleteExistingCompetition(1)).rejects.toThrow(errorMessage);
      expect(store.error).toBe(errorMessage);
    });
  });

  describe('utility actions', () => {
    it('should clear error', () => {
      const store = useCompetitionStore();
      store.error = 'Some error';

      store.clearError();

      expect(store.error).toBeNull();
    });

    it('should clear current competition', () => {
      const store = useCompetitionStore();
      store.currentCompetition = mockCompetition;

      store.clearCurrentCompetition();

      expect(store.currentCompetition).toBeNull();
    });
  });
});
