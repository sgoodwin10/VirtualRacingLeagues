import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTeamStore } from '../teamStore';
import type { Team } from '@user/types/team';
import * as teamService from '@user/services/teamService';

// Mock the team service
vi.mock('@user/services/teamService');

describe('teamStore', () => {
  let store: ReturnType<typeof useTeamStore>;

  const mockTeam: Team = {
    id: 1,
    season_id: 1,
    name: 'Red Bull Racing',
    logo_url: 'https://example.com/logo.png',
    created_at: '2024-01-01T00:00:00.000000Z',
    updated_at: '2024-01-01T00:00:00.000000Z',
  };

  const mockTeams: Team[] = [
    mockTeam,
    {
      id: 2,
      season_id: 1,
      name: 'Mercedes AMG',
      logo_url: null,
      created_at: '2024-01-01T00:00:00.000000Z',
      updated_at: '2024-01-01T00:00:00.000000Z',
    },
  ];

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useTeamStore();
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('initializes with empty state', () => {
      expect(store.teams).toEqual([]);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });

  describe('Getters', () => {
    beforeEach(() => {
      store.teams = mockTeams;
    });

    it('getTeamById returns correct team', () => {
      const team = store.getTeamById(1);
      expect(team).toEqual(mockTeam);
    });

    it('getTeamById returns undefined for non-existent team', () => {
      const team = store.getTeamById(999);
      expect(team).toBeUndefined();
    });

    it('getTeamsBySeasonId filters teams by season', () => {
      const teams = store.getTeamsBySeasonId(1);
      expect(teams).toHaveLength(2);
    });

    it('teamCount returns correct count', () => {
      expect(store.teamCount).toBe(2);
    });

    it('hasTeams returns true when teams exist', () => {
      expect(store.hasTeams).toBe(true);
    });

    it('hasTeams returns false when no teams', () => {
      store.teams = [];
      expect(store.hasTeams).toBe(false);
    });
  });

  describe('Actions', () => {
    describe('fetchTeams', () => {
      it('fetches teams successfully', async () => {
        vi.mocked(teamService.getTeams).mockResolvedValue(mockTeams);

        await store.fetchTeams(1);

        expect(teamService.getTeams).toHaveBeenCalledWith(1);
        expect(store.teams).toEqual(mockTeams);
        expect(store.loading).toBe(false);
        expect(store.error).toBeNull();
      });

      it('sets loading state during fetch', async () => {
        vi.mocked(teamService.getTeams).mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve(mockTeams), 100)),
        );

        const promise = store.fetchTeams(1);
        expect(store.loading).toBe(true);

        await promise;
        expect(store.loading).toBe(false);
      });

      it('handles fetch error', async () => {
        const error = new Error('Failed to fetch teams');
        vi.mocked(teamService.getTeams).mockRejectedValue(error);

        await expect(store.fetchTeams(1)).rejects.toThrow('Failed to fetch teams');

        expect(store.error).toBe('Failed to fetch teams');
        expect(store.loading).toBe(false);
      });
    });

    describe('createTeam', () => {
      it('creates team successfully', async () => {
        const formData = new FormData();
        vi.mocked(teamService.buildCreateTeamFormData).mockReturnValue(formData);
        vi.mocked(teamService.createTeam).mockResolvedValue(mockTeam);

        const result = await store.createTeam(1, { name: 'Red Bull Racing' });

        expect(teamService.buildCreateTeamFormData).toHaveBeenCalledWith({
          name: 'Red Bull Racing',
        });
        expect(teamService.createTeam).toHaveBeenCalledWith(1, formData);
        expect(result).toEqual(mockTeam);
        expect(store.teams).toContainEqual(mockTeam);
        expect(store.loading).toBe(false);
        expect(store.error).toBeNull();
      });

      it('handles create error', async () => {
        const error = new Error('Failed to create team');
        vi.mocked(teamService.buildCreateTeamFormData).mockReturnValue(new FormData());
        vi.mocked(teamService.createTeam).mockRejectedValue(error);

        await expect(store.createTeam(1, { name: 'Test' })).rejects.toThrow(
          'Failed to create team',
        );

        expect(store.error).toBe('Failed to create team');
      });
    });

    describe('updateTeam', () => {
      beforeEach(() => {
        store.teams = [...mockTeams];
      });

      it('updates team successfully', async () => {
        const updatedTeam = { ...mockTeam, name: 'Red Bull Racing Updated' };
        vi.mocked(teamService.buildUpdateTeamFormData).mockReturnValue(new FormData());
        vi.mocked(teamService.updateTeam).mockResolvedValue(updatedTeam);

        const result = await store.updateTeam(1, 1, { name: 'Red Bull Racing Updated' });

        expect(result).toEqual(updatedTeam);
        expect(store.teams[0]).toEqual(updatedTeam);
        expect(store.error).toBeNull();
      });

      it('handles update error', async () => {
        const error = new Error('Failed to update team');
        vi.mocked(teamService.buildUpdateTeamFormData).mockReturnValue(new FormData());
        vi.mocked(teamService.updateTeam).mockRejectedValue(error);

        await expect(store.updateTeam(1, 1, { name: 'Test' })).rejects.toThrow(
          'Failed to update team',
        );

        expect(store.error).toBe('Failed to update team');
      });
    });

    describe('deleteTeam', () => {
      beforeEach(() => {
        store.teams = [...mockTeams];
      });

      it('deletes team successfully', async () => {
        vi.mocked(teamService.deleteTeam).mockResolvedValue();

        await store.deleteTeam(1, 1);

        expect(teamService.deleteTeam).toHaveBeenCalledWith(1, 1);
        expect(store.teams).not.toContainEqual(mockTeam);
        expect(store.teams).toHaveLength(1);
        expect(store.error).toBeNull();
      });

      it('handles delete error', async () => {
        const error = new Error('Failed to delete team');
        vi.mocked(teamService.deleteTeam).mockRejectedValue(error);

        await expect(store.deleteTeam(1, 1)).rejects.toThrow('Failed to delete team');

        expect(store.error).toBe('Failed to delete team');
        expect(store.teams).toHaveLength(2); // Teams unchanged
      });
    });

    describe('assignDriverToTeam', () => {
      it('assigns driver to team successfully', async () => {
        vi.mocked(teamService.assignDriverToTeam).mockResolvedValue();

        await store.assignDriverToTeam(1, 1, { team_id: 1 });

        expect(teamService.assignDriverToTeam).toHaveBeenCalledWith(1, 1, { team_id: 1 });
        expect(store.error).toBeNull();
      });

      it('handles assign error', async () => {
        const error = new Error('Failed to assign driver to team');
        vi.mocked(teamService.assignDriverToTeam).mockRejectedValue(error);

        await expect(store.assignDriverToTeam(1, 1, { team_id: 1 })).rejects.toThrow(
          'Failed to assign driver to team',
        );

        expect(store.error).toBe('Failed to assign driver to team');
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
      store.teams = mockTeams;
      store.loading = true;
      store.error = 'Some error';

      store.resetStore();

      expect(store.teams).toEqual([]);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });
  });
});
