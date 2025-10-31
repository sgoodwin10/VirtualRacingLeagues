/**
 * Team API Service
 * Handles all HTTP requests for team management
 */

import { apiClient } from './api';
import type {
  Team,
  CreateTeamPayload,
  UpdateTeamPayload,
  AssignDriverTeamPayload,
} from '@app/types/team';
import type { AxiosResponse } from 'axios';

// API response wrapper
interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * Get all teams for a season
 */
export async function getTeams(seasonId: number): Promise<Team[]> {
  const response: AxiosResponse<ApiResponse<Team[]>> = await apiClient.get(
    `/seasons/${seasonId}/teams`,
  );
  return response.data.data;
}

/**
 * Create a new team
 */
export async function createTeam(seasonId: number, formData: FormData): Promise<Team> {
  const response: AxiosResponse<ApiResponse<Team>> = await apiClient.post(
    `/seasons/${seasonId}/teams`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return response.data.data;
}

/**
 * Update team
 */
export async function updateTeam(
  seasonId: number,
  teamId: number,
  formData: FormData,
): Promise<Team> {
  // Laravel method spoofing for PUT with multipart/form-data
  formData.append('_method', 'PUT');

  const response: AxiosResponse<ApiResponse<Team>> = await apiClient.post(
    `/seasons/${seasonId}/teams/${teamId}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return response.data.data;
}

/**
 * Delete team (hard delete)
 */
export async function deleteTeam(seasonId: number, teamId: number): Promise<void> {
  await apiClient.delete(`/seasons/${seasonId}/teams/${teamId}`);
}

/**
 * Assign driver to team
 */
export async function assignDriverToTeam(
  seasonId: number,
  seasonDriverId: number,
  payload: AssignDriverTeamPayload,
): Promise<void> {
  await apiClient.put(`/seasons/${seasonId}/drivers/${seasonDriverId}/team`, payload);
}

/**
 * Build FormData from create team payload
 */
export function buildCreateTeamFormData(data: CreateTeamPayload): FormData {
  const formData = new FormData();

  formData.append('name', data.name);

  if (data.logo) {
    formData.append('logo', data.logo);
  }

  return formData;
}

/**
 * Build FormData from update team payload
 */
export function buildUpdateTeamFormData(data: UpdateTeamPayload): FormData {
  const formData = new FormData();

  if (data.name !== undefined) {
    formData.append('name', data.name);
  }

  // Only send if it's an actual File object (new upload)
  if (data.logo !== undefined && data.logo !== null) {
    formData.append('logo', data.logo);
  }

  return formData;
}
