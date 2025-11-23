/**
 * Competition API Service
 * Handles all HTTP requests for competition management
 */

import { apiClient } from './api';
import type { Competition, CompetitionFilters, SlugCheckResponse } from '@app/types/competition';
import type { AxiosResponse } from 'axios';
import { API_ENDPOINTS } from '@app/constants/apiEndpoints';

// API response wrapper
interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * Get all competitions for a league
 */
export async function getLeagueCompetitions(
  leagueId: number,
  filters?: CompetitionFilters,
): Promise<Competition[]> {
  const response: AxiosResponse<ApiResponse<Competition[]>> = await apiClient.get(
    API_ENDPOINTS.leagues.competitions(leagueId),
    { params: filters },
  );
  return response.data.data;
}

/**
 * Get a specific competition
 */
export async function getCompetition(id: number): Promise<Competition> {
  const response: AxiosResponse<ApiResponse<Competition>> = await apiClient.get(
    API_ENDPOINTS.competitions.detail(id),
  );
  return response.data.data;
}

/**
 * Create a new competition
 */
export async function createCompetition(
  leagueId: number,
  formData: FormData,
): Promise<Competition> {
  const response: AxiosResponse<ApiResponse<Competition>> = await apiClient.post(
    API_ENDPOINTS.leagues.competitions(leagueId),
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
 * Update an existing competition
 */
export async function updateCompetition(id: number, formData: FormData): Promise<Competition> {
  // Laravel method spoofing for PUT with multipart/form-data
  formData.append('_method', 'PUT');

  const response: AxiosResponse<ApiResponse<Competition>> = await apiClient.post(
    API_ENDPOINTS.competitions.update(id),
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
 * Archive a competition
 */
export async function archiveCompetition(id: number): Promise<void> {
  await apiClient.post(API_ENDPOINTS.competitions.archive(id));
}

/**
 * Delete a competition permanently
 */
export async function deleteCompetition(id: number): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.competitions.delete(id));
}

/**
 * Check slug availability
 */
export async function checkSlugAvailability(
  leagueId: number,
  name: string,
  excludeId?: number,
): Promise<SlugCheckResponse> {
  const response: AxiosResponse<ApiResponse<SlugCheckResponse>> = await apiClient.post(
    API_ENDPOINTS.competitions.checkSlug(leagueId),
    { name, exclude_id: excludeId },
  );
  return response.data.data;
}

/**
 * Build FormData from form state (create)
 */
export function buildCompetitionFormData(form: {
  name: string;
  description: string;
  platform_id: number;
  logo: File | null;
  competition_colour?: string | null;
}): FormData {
  const formData = new FormData();

  formData.append('name', form.name);
  formData.append('platform_id', form.platform_id.toString());

  if (form.description) {
    formData.append('description', form.description);
  }

  if (form.logo) {
    formData.append('logo', form.logo);
  }

  if (form.competition_colour) {
    formData.append('competition_colour', form.competition_colour);
  }

  return formData;
}

/**
 * Build FormData from form state (update)
 */
export function buildUpdateCompetitionFormData(form: {
  name?: string;
  description?: string | null;
  logo?: File | null;
  competition_colour?: string | null;
}): FormData {
  const formData = new FormData();

  if (form.name !== undefined) {
    formData.append('name', form.name);
  }

  if (form.description !== undefined) {
    formData.append('description', form.description || '');
  }

  if (form.logo !== undefined && form.logo !== null) {
    formData.append('logo', form.logo);
  }

  if (form.competition_colour !== undefined) {
    formData.append('competition_colour', form.competition_colour || '');
  }

  return formData;
}
