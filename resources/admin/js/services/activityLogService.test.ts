import { describe, it, expect, vi, beforeEach } from 'vitest';
import { activityLogService } from './activityLogService';
import { apiService } from './api';
import type { ActivityListResponse } from '@admin/types/activityLog';
import { createMockActivity } from '@admin/__tests__/helpers/mockFactories';

vi.mock('./api');

describe('activityLogService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockActivity = createMockActivity();

  it('should fetch all activities', async () => {
    const mockResponse: ActivityListResponse = {
      success: true,
      data: [mockActivity],
    };

    vi.mocked(apiService.get).mockResolvedValue(mockResponse);

    const result = await activityLogService.getAllActivities();

    expect(result).toEqual([mockActivity]);
    expect(apiService.get).toHaveBeenCalledWith('/activities', {
      params: undefined,
      signal: undefined,
    });
  });

  it('should fetch user activities', async () => {
    const mockResponse: ActivityListResponse = {
      success: true,
      data: [mockActivity],
    };

    vi.mocked(apiService.get).mockResolvedValue(mockResponse);

    const result = await activityLogService.getUserActivities();

    expect(result).toEqual([mockActivity]);
    expect(apiService.get).toHaveBeenCalledWith('/activities/users', {
      params: undefined,
      signal: undefined,
    });
  });

  it('should fetch admin activities', async () => {
    const mockResponse: ActivityListResponse = {
      success: true,
      data: [mockActivity],
    };

    vi.mocked(apiService.get).mockResolvedValue(mockResponse);

    const result = await activityLogService.getAdminActivities();

    expect(result).toEqual([mockActivity]);
    expect(apiService.get).toHaveBeenCalledWith('/activities/admins', {
      params: undefined,
      signal: undefined,
    });
  });

  it('should fetch activities for specific user', async () => {
    const userId = 123;
    const mockResponse: ActivityListResponse = {
      success: true,
      data: [mockActivity],
    };

    vi.mocked(apiService.get).mockResolvedValue(mockResponse);

    const result = await activityLogService.getActivitiesForUser(userId);

    expect(result).toEqual([mockActivity]);
    expect(apiService.get).toHaveBeenCalledWith(`/activities/user/${userId}`, {
      signal: undefined,
    });
  });

  it('should fetch single activity by ID', async () => {
    const activityId = 456;
    const mockResponse = {
      success: true,
      data: mockActivity,
    };

    vi.mocked(apiService.get).mockResolvedValue(mockResponse);

    const result = await activityLogService.getActivity(activityId);

    expect(result).toEqual(mockActivity);
    expect(apiService.get).toHaveBeenCalledWith(`/activities/${activityId}`, { signal: undefined });
  });

  it('should clean old activities', async () => {
    const mockResponse = {
      success: true,
      message: 'Activities cleaned',
      deleted_count: 50,
    };

    vi.mocked(apiService.post).mockResolvedValue(mockResponse);

    const result = await activityLogService.cleanOldActivities(90);

    expect(result).toEqual(mockResponse);
    expect(apiService.post).toHaveBeenCalledWith(
      '/activities/clean',
      { days: 90 },
      { signal: undefined },
    );
  });

  it('should throw error when response is unsuccessful', async () => {
    vi.mocked(apiService.get).mockResolvedValue({ success: false, message: 'Failed' });

    await expect(activityLogService.getAllActivities()).rejects.toThrow('Failed');
  });
});
