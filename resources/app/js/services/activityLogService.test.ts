import { describe, it, expect, beforeEach, vi } from 'vitest';
import { activityLogService } from '@app/services/activityLogService';
import { apiClient } from '@app/services/api';
import type { Activity, ActivityListResponse } from '@app/types/activityLog';

vi.mock('@app/services/api');

describe('ActivityLogService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getActivities', () => {
    it('should fetch activities successfully', async () => {
      const mockActivities: Activity[] = [
        {
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
          },
          event: null,
          created_at: '2024-01-01T12:00:00.000000Z',
          updated_at: '2024-01-01T12:00:00.000000Z',
        },
      ];

      const mockResponse: ActivityListResponse = {
        success: true,
        data: mockActivities,
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 25,
          total: 1,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockResponse,
      });

      const result = await activityLogService.getActivities(1);

      expect(apiClient.get).toHaveBeenCalledWith('/leagues/1/activities', {
        params: undefined,
        signal: undefined,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should pass filter params correctly', async () => {
      const mockResponse: ActivityListResponse = {
        success: true,
        data: [],
      };

      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockResponse,
      });

      await activityLogService.getActivities(
        1,
        {
          limit: 50,
          page: 2,
          entity_type: 'driver',
          action: 'create',
        },
        undefined,
      );

      expect(apiClient.get).toHaveBeenCalledWith('/leagues/1/activities', {
        params: {
          limit: 50,
          page: 2,
          entity_type: 'driver',
          action: 'create',
        },
        signal: undefined,
      });
    });

    it('should handle network errors', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));

      await expect(activityLogService.getActivities(1)).rejects.toThrow('Network error');
    });
  });

  describe('getActivity', () => {
    it('should fetch single activity successfully', async () => {
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
        },
        event: null,
        created_at: '2024-01-01T12:00:00.000000Z',
        updated_at: '2024-01-01T12:00:00.000000Z',
      };

      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          success: true,
          data: mockActivity,
        },
      });

      const result = await activityLogService.getActivity(1, 1);

      expect(apiClient.get).toHaveBeenCalledWith('/leagues/1/activities/1', {
        signal: undefined,
      });
      expect(result).toEqual(mockActivity);
    });

    it('should throw error when response is unsuccessful', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          success: false,
          message: 'Activity not found',
        },
      });

      await expect(activityLogService.getActivity(1, 1)).rejects.toThrow('Activity not found');
    });

    it('should throw error when data is missing', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: {
          success: true,
          data: null,
        },
      });

      await expect(activityLogService.getActivity(1, 1)).rejects.toThrow(
        'Failed to fetch activity',
      );
    });
  });
});
