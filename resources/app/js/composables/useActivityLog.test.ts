import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useActivityLog } from './useActivityLog';
import { activityLogService } from '@app/services/activityLogService';
import type { Activity, ActivityListResponse } from '@app/types/activityLog';

vi.mock('@app/services/activityLogService');

describe('useActivityLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockActivity: Activity = {
    id: 1,
    log_name: 'league',
    description: 'Created driver John Doe',
    subject_type: 'App\\Domain\\Driver\\Entities\\Driver',
    subject_id: 1,
    causer_type: 'App\\Domain\\User\\Entities\\User',
    causer_id: 1,
    causer: {
      id: 1,
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@example.com',
    },
    properties: {
      league_id: 1,
      league_name: 'Test League',
      action: 'create',
      entity_type: 'driver',
      entity_id: 1,
      entity_name: 'John Doe',
      context: {
        competition_name: 'F1 Championship',
        season_name: '2024',
        round_name: 'Round 1',
      },
    },
    event: null,
    created_at: '2024-01-01T12:00:00.000000Z',
    updated_at: '2024-01-01T12:00:00.000000Z',
  };

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { activities, loading, error, currentPage, lastPage, total } = useActivityLog(1);

      expect(activities.value).toEqual([]);
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
      expect(currentPage.value).toBe(1);
      expect(lastPage.value).toBe(1);
      expect(total.value).toBe(0);
    });
  });

  describe('fetchActivities', () => {
    it('should fetch activities successfully', async () => {
      const mockResponse: ActivityListResponse = {
        success: true,
        data: [mockActivity],
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 25,
          total: 1,
        },
      };

      vi.mocked(activityLogService.getActivities).mockResolvedValue(mockResponse);

      const { fetchActivities, activities, loading, error } = useActivityLog(1);

      await fetchActivities();

      expect(activities.value).toEqual([mockActivity]);
      expect(loading.value).toBe(false);
      expect(error.value).toBeNull();
    });

    it('should handle errors correctly', async () => {
      vi.mocked(activityLogService.getActivities).mockRejectedValue(
        new Error('Failed to fetch activities'),
      );

      const { fetchActivities, error, loading } = useActivityLog(1);

      await fetchActivities();

      expect(error.value).toBe('Failed to fetch activities');
      expect(loading.value).toBe(false);
    });

    it('should update pagination metadata', async () => {
      const mockResponse: ActivityListResponse = {
        success: true,
        data: [mockActivity],
        meta: {
          current_page: 2,
          last_page: 5,
          per_page: 25,
          total: 100,
        },
      };

      vi.mocked(activityLogService.getActivities).mockResolvedValue(mockResponse);

      const { fetchActivities, currentPage, lastPage, total } = useActivityLog(1);

      await fetchActivities();

      expect(currentPage.value).toBe(2);
      expect(lastPage.value).toBe(5);
      expect(total.value).toBe(100);
    });
  });

  describe('formatActivity', () => {
    it('should format activity correctly', async () => {
      const mockResponse: ActivityListResponse = {
        success: true,
        data: [mockActivity],
      };

      vi.mocked(activityLogService.getActivities).mockResolvedValue(mockResponse);

      const { fetchActivities, formattedActivities } = useActivityLog(1);

      await fetchActivities();

      const formatted = formattedActivities.value[0]!;

      expect(formatted.id).toBe(1);
      expect(formatted.description).toBe('Created driver John Doe');
      expect(formatted.icon).toBe('pi-user');
      expect(formatted.iconColor).toBe('text-green-500');
      expect(formatted.causer).toBe('Admin User');
      expect(formatted.entityType).toBe('driver');
      expect(formatted.entityName).toBe('John Doe');
      expect(formatted.action).toBe('create');
      expect(formatted.context).toBe('F1 Championship > 2024 > Round 1');
      expect(formatted.timestamp).toBeTruthy();
      expect(formatted.relativeTime).toBeTruthy();
    });

    it('should handle system causer', async () => {
      const activityWithoutCauser: Activity = {
        ...mockActivity,
        causer: null,
      };

      const mockResponse: ActivityListResponse = {
        success: true,
        data: [activityWithoutCauser],
      };

      vi.mocked(activityLogService.getActivities).mockResolvedValue(mockResponse);

      const { fetchActivities, formattedActivities } = useActivityLog(1);

      await fetchActivities();

      expect(formattedActivities.value[0]!.causer).toBe('System');
    });

    it('should map entity types to correct icons', async () => {
      const entities = [
        { type: 'league' as const, icon: 'pi-flag' },
        { type: 'driver' as const, icon: 'pi-user' },
        { type: 'competition' as const, icon: 'pi-trophy' },
        { type: 'season' as const, icon: 'pi-calendar' },
        { type: 'round' as const, icon: 'pi-circle' },
        { type: 'race' as const, icon: 'pi-car' },
        { type: 'qualifier' as const, icon: 'pi-clock' },
        { type: 'division' as const, icon: 'pi-th-large' },
        { type: 'team' as const, icon: 'pi-users' },
        { type: 'season_driver' as const, icon: 'pi-user-plus' },
      ];

      for (const entity of entities) {
        const activity: Activity = {
          ...mockActivity,
          properties: {
            ...mockActivity.properties,
            entity_type: entity.type,
          },
        };

        const mockResponse: ActivityListResponse = {
          success: true,
          data: [activity],
        };

        vi.mocked(activityLogService.getActivities).mockResolvedValue(mockResponse);

        const { fetchActivities, formattedActivities } = useActivityLog(1);

        await fetchActivities();

        expect(formattedActivities.value[0]!.icon).toBe(entity.icon);
      }
    });

    it('should map actions to correct colors', async () => {
      const actions = [
        { type: 'create' as const, color: 'text-green-500' },
        { type: 'update' as const, color: 'text-blue-500' },
        { type: 'delete' as const, color: 'text-red-500' },
        { type: 'complete' as const, color: 'text-purple-500' },
        { type: 'archive' as const, color: 'text-gray-500' },
        { type: 'import' as const, color: 'text-cyan-500' },
        { type: 'add_driver' as const, color: 'text-green-500' },
        { type: 'remove_driver' as const, color: 'text-red-500' },
        { type: 'reorder' as const, color: 'text-yellow-500' },
        { type: 'enter_results' as const, color: 'text-blue-500' },
      ];

      for (const action of actions) {
        const activity: Activity = {
          ...mockActivity,
          properties: {
            ...mockActivity.properties,
            action: action.type,
          },
        };

        const mockResponse: ActivityListResponse = {
          success: true,
          data: [activity],
        };

        vi.mocked(activityLogService.getActivities).mockResolvedValue(mockResponse);

        const { fetchActivities, formattedActivities } = useActivityLog(1);

        await fetchActivities();

        expect(formattedActivities.value[0]!.iconColor).toBe(action.color);
      }
    });
  });

  describe('updateFilters', () => {
    it('should update filters and fetch activities', async () => {
      const mockResponse: ActivityListResponse = {
        success: true,
        data: [],
      };

      vi.mocked(activityLogService.getActivities).mockResolvedValue(mockResponse);

      const { updateFilters, filters } = useActivityLog(1);

      updateFilters({ entity_type: 'driver', action: 'create' });

      expect(filters.value.entity_type).toBe('driver');
      expect(filters.value.action).toBe('create');
      expect(filters.value.page).toBe(1);
      expect(activityLogService.getActivities).toHaveBeenCalled();
    });
  });

  describe('goToPage', () => {
    it('should navigate to specific page', async () => {
      const mockResponse: ActivityListResponse = {
        success: true,
        data: [],
      };

      vi.mocked(activityLogService.getActivities).mockResolvedValue(mockResponse);

      const { goToPage, filters } = useActivityLog(1);

      goToPage(3);

      expect(filters.value.page).toBe(3);
      expect(activityLogService.getActivities).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should refresh activities', async () => {
      const mockResponse: ActivityListResponse = {
        success: true,
        data: [],
      };

      vi.mocked(activityLogService.getActivities).mockResolvedValue(mockResponse);

      const { refresh } = useActivityLog(1);

      refresh();

      expect(activityLogService.getActivities).toHaveBeenCalled();
    });
  });
});
