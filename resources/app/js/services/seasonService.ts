/**
 * Season API Service
 * Handles all HTTP requests for season management
 */

import { apiClient } from './api';
import type {
  Season,
  CreateSeasonRequest,
  UpdateSeasonRequest,
  SeasonQueryParams,
  SlugCheckResponse,
} from '@app/types/season';
import type { AxiosResponse } from 'axios';

// API response wrapper
interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * Get all seasons for a competition
 * Note: Backend returns all seasons as a simple array, not paginated
 */
export async function getSeasons(
  competitionId: number,
  params?: SeasonQueryParams,
): Promise<Season[]> {
  const response: AxiosResponse<ApiResponse<Season[]>> = await apiClient.get(
    `/competitions/${competitionId}/seasons`,
    { params },
  );
  return response.data.data;
}

/**
 * Get a single season by ID
 */
export async function getSeasonById(seasonId: number): Promise<Season> {
  const response: AxiosResponse<ApiResponse<Season>> = await apiClient.get(`/seasons/${seasonId}`);
  return response.data.data;
}

/**
 * Create a new season
 */
export async function createSeason(competitionId: number, formData: FormData): Promise<Season> {
  const response: AxiosResponse<ApiResponse<Season>> = await apiClient.post(
    `/competitions/${competitionId}/seasons`,
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
 * Update season
 */
export async function updateSeason(seasonId: number, formData: FormData): Promise<Season> {
  // Laravel method spoofing for PUT with multipart/form-data
  formData.append('_method', 'PUT');

  const response: AxiosResponse<ApiResponse<Season>> = await apiClient.post(
    `/seasons/${seasonId}`,
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
 * Archive season
 */
export async function archiveSeason(seasonId: number): Promise<Season> {
  const response: AxiosResponse<ApiResponse<Season>> = await apiClient.post(
    `/seasons/${seasonId}/archive`,
  );
  return response.data.data;
}

/**
 * Activate season
 */
export async function activateSeason(seasonId: number): Promise<Season> {
  const response: AxiosResponse<ApiResponse<Season>> = await apiClient.post(
    `/seasons/${seasonId}/activate`,
  );
  return response.data.data;
}

/**
 * Complete season
 */
export async function completeSeason(seasonId: number): Promise<Season> {
  const response: AxiosResponse<ApiResponse<Season>> = await apiClient.post(
    `/seasons/${seasonId}/complete`,
  );
  return response.data.data;
}

/**
 * Delete season (soft delete)
 */
export async function deleteSeason(seasonId: number): Promise<void> {
  await apiClient.delete(`/seasons/${seasonId}`);
}

/**
 * Restore deleted season
 */
export async function restoreSeason(seasonId: number): Promise<Season> {
  const response: AxiosResponse<ApiResponse<Season>> = await apiClient.post(
    `/seasons/${seasonId}/restore`,
  );
  return response.data.data;
}

/**
 * Check slug availability
 */
export async function checkSeasonSlugAvailability(
  competitionId: number,
  name: string,
  excludeSeasonId?: number,
): Promise<SlugCheckResponse> {
  const response: AxiosResponse<ApiResponse<SlugCheckResponse>> = await apiClient.post(
    `/competitions/${competitionId}/seasons/check-slug`,
    { name, exclude_id: excludeSeasonId },
  );
  return response.data.data;
}

/**
 * Build FormData from create season request
 */
export function buildCreateSeasonFormData(data: CreateSeasonRequest): FormData {
  const formData = new FormData();

  formData.append('name', data.name);

  if (data.car_class) {
    formData.append('car_class', data.car_class);
  }

  if (data.description) {
    formData.append('description', data.description);
  }

  if (data.technical_specs) {
    formData.append('technical_specs', data.technical_specs);
  }

  if (data.logo) {
    formData.append('logo', data.logo);
  }

  if (data.banner) {
    formData.append('banner', data.banner);
  }

  if (data.race_divisions_enabled !== undefined) {
    formData.append('race_divisions_enabled', data.race_divisions_enabled ? '1' : '0');
  }

  if (data.team_championship_enabled !== undefined) {
    formData.append('team_championship_enabled', data.team_championship_enabled ? '1' : '0');
  }

  return formData;
}

/**
 * Build FormData from update season request
 *
 * NOTE: Empty strings are used to clear optional text fields.
 * - If a field is undefined, it won't be sent to the backend (no update)
 * - If a field is null or empty string '', it will be sent as '' (clears the field)
 * - File fields (logo, banner) are only sent if they are File objects
 *
 * This allows partial updates while also supporting field clearing.
 */
export function buildUpdateSeasonFormData(data: UpdateSeasonRequest): FormData {
  const formData = new FormData();

  if (data.name !== undefined) {
    formData.append('name', data.name);
  }

  // Empty string means "clear this field"
  if (data.car_class !== undefined) {
    formData.append('car_class', data.car_class || '');
  }

  // Empty string means "clear this field"
  if (data.description !== undefined) {
    formData.append('description', data.description || '');
  }

  // Empty string means "clear this field"
  if (data.technical_specs !== undefined) {
    formData.append('technical_specs', data.technical_specs || '');
  }

  // Only send if it's an actual File object (new upload)
  if (data.logo !== undefined && data.logo !== null) {
    formData.append('logo', data.logo);
  }

  // Only send if it's an actual File object (new upload)
  if (data.banner !== undefined && data.banner !== null) {
    formData.append('banner', data.banner);
  }

  if (data.race_divisions_enabled !== undefined) {
    formData.append('race_divisions_enabled', data.race_divisions_enabled ? '1' : '0');
  }

  if (data.team_championship_enabled !== undefined) {
    formData.append('team_championship_enabled', data.team_championship_enabled ? '1' : '0');
  }

  return formData;
}
