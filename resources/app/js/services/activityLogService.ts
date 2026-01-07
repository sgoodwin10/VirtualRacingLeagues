/**
 * Activity Log Service
 * Handles API calls for league activity logs
 */

import { apiClient } from './api';
import type {
  Activity,
  ActivityListResponse,
  ActivityResponse,
  ActivityFilterParams,
} from '@app/types/activityLog';
import type { AxiosResponse } from 'axios';

/**
 * Get activities for a league
 * @param leagueId - League ID
 * @param params - Optional filter parameters
 * @param signal - Optional AbortSignal for cancellation
 */
export async function getActivities(
  leagueId: number,
  params?: ActivityFilterParams,
  signal?: AbortSignal,
): Promise<ActivityListResponse> {
  const response: AxiosResponse<ActivityListResponse> = await apiClient.get(
    `/leagues/${leagueId}/activities`,
    { params, signal },
  );

  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to fetch activities');
  }

  return response.data;
}

/**
 * Get single activity by ID
 * @param leagueId - League ID
 * @param activityId - Activity ID
 * @param signal - Optional AbortSignal for cancellation
 */
export async function getActivity(
  leagueId: number,
  activityId: number,
  signal?: AbortSignal,
): Promise<Activity> {
  const response: AxiosResponse<ActivityResponse> = await apiClient.get(
    `/leagues/${leagueId}/activities/${activityId}`,
    { signal },
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.message || 'Failed to fetch activity');
  }

  return response.data.data;
}

/**
 * Grouped export for convenient importing
 */
export const activityLogService = {
  getActivities,
  getActivity,
};

export default activityLogService;
