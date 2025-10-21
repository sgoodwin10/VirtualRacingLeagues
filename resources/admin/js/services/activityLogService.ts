import { apiService } from './api';
import type {
  Activity,
  ActivityListResponse,
  ActivityResponse,
  ActivityFilterParams,
  CleanActivitiesResponse,
} from '@admin/types/activityLog';
import { handleServiceError } from '@admin/utils/errorHandler';

/**
 * Activity Log Service
 * Handles API calls for activity log management
 */
class ActivityLogService {
  /**
   * Get all activities (both user and admin)
   * @param params - Optional filter parameters
   * @param signal - Optional AbortSignal for request cancellation
   */
  async getAllActivities(params?: ActivityFilterParams, signal?: AbortSignal): Promise<Activity[]> {
    try {
      const response = await apiService.get<ActivityListResponse>('/activities', {
        params,
        signal,
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch activities');
      }

      return response.data;
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Get user activities only
   * @param params - Optional filter parameters
   * @param signal - Optional AbortSignal for request cancellation
   */
  async getUserActivities(
    params?: ActivityFilterParams,
    signal?: AbortSignal,
  ): Promise<Activity[]> {
    try {
      const response = await apiService.get<ActivityListResponse>('/activities/users', {
        params,
        signal,
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch user activities');
      }

      return response.data;
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Get admin activities only
   * @param params - Optional filter parameters
   * @param signal - Optional AbortSignal for request cancellation
   */
  async getAdminActivities(
    params?: ActivityFilterParams,
    signal?: AbortSignal,
  ): Promise<Activity[]> {
    try {
      const response = await apiService.get<ActivityListResponse>('/activities/admins', {
        params,
        signal,
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch admin activities');
      }

      return response.data;
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Get activities for a specific user
   * @param userId - User ID
   * @param signal - Optional AbortSignal for request cancellation
   */
  async getActivitiesForUser(userId: number, signal?: AbortSignal): Promise<Activity[]> {
    try {
      const response = await apiService.get<ActivityListResponse>(`/activities/user/${userId}`, {
        signal,
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch user activities');
      }

      return response.data;
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Get activities for a specific admin
   * @param adminId - Admin ID
   * @param signal - Optional AbortSignal for request cancellation
   */
  async getActivitiesForAdmin(adminId: number, signal?: AbortSignal): Promise<Activity[]> {
    try {
      const response = await apiService.get<ActivityListResponse>(`/activities/admin/${adminId}`, {
        signal,
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch admin activities');
      }

      return response.data;
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Get single activity by ID
   * @param id - Activity ID
   * @param signal - Optional AbortSignal for request cancellation
   */
  async getActivity(id: number, signal?: AbortSignal): Promise<Activity> {
    try {
      const response = await apiService.get<ActivityResponse>(`/activities/${id}`, { signal });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch activity');
      }

      return response.data;
    } catch (error) {
      handleServiceError(error);
    }
  }

  /**
   * Clean old activities (delete records older than specified days)
   * @param days - Number of days to keep (default: 365)
   * @param signal - Optional AbortSignal for request cancellation
   */
  async cleanOldActivities(
    days: number = 365,
    signal?: AbortSignal,
  ): Promise<CleanActivitiesResponse> {
    try {
      const response = await apiService.post<CleanActivitiesResponse>(
        '/activities/clean',
        { days },
        { signal },
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to clean activities');
      }

      return response;
    } catch (error) {
      handleServiceError(error);
    }
  }
}

// Export a singleton instance
export const activityLogService = new ActivityLogService();
export default activityLogService;
