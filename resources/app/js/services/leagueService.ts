/**
 * League API Service
 * Handles all HTTP requests related to league management
 */

import { apiClient } from './api';
import type {
  League,
  Platform,
  Timezone,
  SlugCheckResponse,
  CreateLeagueForm,
  UpdateLeagueForm,
  PlatformColumn,
  PlatformFormField,
  PlatformCsvHeader,
} from '@app/types/league';
import type { AxiosResponse } from 'axios';
import { API_ENDPOINTS } from '@app/constants/apiEndpoints';
import type { ApiResponse } from '@app/types/api';

/**
 * Get all active platforms
 */
export async function getPlatforms(): Promise<Platform[]> {
  const response: AxiosResponse<ApiResponse<Platform[]>> = await apiClient.get(
    API_ENDPOINTS.platforms.list(),
  );
  return response.data.data;
}

/**
 * Get all available timezones
 */
export async function getTimezones(): Promise<Timezone[]> {
  const response: AxiosResponse<ApiResponse<Timezone[]>> = await apiClient.get(
    API_ENDPOINTS.timezones.list(),
  );
  return response.data.data;
}

/**
 * Check if a league slug is available
 * @param name - The league name to check
 * @param leagueId - Optional league ID to exclude from the check (for edit mode)
 */
export async function checkSlugAvailability(
  name: string,
  leagueId?: number,
): Promise<SlugCheckResponse> {
  const response: AxiosResponse<ApiResponse<SlugCheckResponse>> = await apiClient.post(
    API_ENDPOINTS.leagues.checkSlug(),
    { name, league_id: leagueId },
  );
  return response.data.data;
}

/**
 * Create a new league
 * @param formData - FormData containing league information and files
 */
export async function createLeague(formData: FormData): Promise<League> {
  const response: AxiosResponse<ApiResponse<League>> = await apiClient.post(
    API_ENDPOINTS.leagues.create(),
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
 * Get all leagues for the authenticated user
 */
export async function getUserLeagues(): Promise<League[]> {
  const response: AxiosResponse<ApiResponse<League[]>> = await apiClient.get(
    API_ENDPOINTS.leagues.list(),
  );
  return response.data.data;
}

/**
 * Get a specific league by ID
 * @param id - League ID
 */
export async function getLeague(id: number): Promise<League> {
  const response: AxiosResponse<ApiResponse<League>> = await apiClient.get(
    API_ENDPOINTS.leagues.detail(id),
  );
  return response.data.data;
}

/**
 * Get a specific league by ID (alias for getLeague)
 * @param id - League ID as string (from route params)
 */
export async function getLeagueById(id: string): Promise<League> {
  return getLeague(parseInt(id, 10));
}

/**
 * Update an existing league
 * @param id - League ID
 * @param formData - FormData containing league updates
 */
export async function updateLeague(id: number, formData: FormData): Promise<League> {
  // Laravel doesn't handle PUT requests with multipart/form-data properly
  // Use POST with _method=PUT (method spoofing)
  formData.append('_method', 'PUT');

  const response: AxiosResponse<ApiResponse<League>> = await apiClient.post(
    API_ENDPOINTS.leagues.update(id),
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
 * Delete a league
 * @param id - League ID
 */
export async function deleteLeague(id: number): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.leagues.delete(id));
}

/**
 * Build FormData from CreateLeagueForm
 * @param form - League form data
 */
export function buildLeagueFormData(form: CreateLeagueForm): FormData {
  const formData = new FormData();

  // Required fields
  formData.append('name', form.name);
  formData.append('visibility', form.visibility);

  // Optional fields (append empty string if null/undefined to avoid "null" string)
  formData.append('timezone', form.timezone || '');
  formData.append('contact_email', form.contact_email || '');
  formData.append('organizer_name', form.organizer_name || '');

  // File uploads
  if (form.logo) {
    formData.append('logo', form.logo);
  }
  if (form.banner) {
    formData.append('banner', form.banner);
  }
  if (form.header_image) {
    formData.append('header_image', form.header_image);
  }

  // Platform IDs as array
  form.platform_ids.forEach((id) => {
    formData.append('platform_ids[]', id.toString());
  });

  // Optional text fields
  if (form.tagline) {
    formData.append('tagline', form.tagline);
  }
  if (form.description) {
    formData.append('description', form.description);
  }

  // Social media fields (only append if not empty)
  if (form.discord_url) {
    formData.append('discord_url', form.discord_url);
  }
  if (form.website_url) {
    formData.append('website_url', form.website_url);
  }
  if (form.twitter_handle) {
    formData.append('twitter_handle', form.twitter_handle);
  }
  if (form.instagram_handle) {
    formData.append('instagram_handle', form.instagram_handle);
  }
  if (form.youtube_url) {
    formData.append('youtube_url', form.youtube_url);
  }
  if (form.twitch_url) {
    formData.append('twitch_url', form.twitch_url);
  }

  return formData;
}

/**
 * Build FormData from UpdateLeagueForm
 * @param form - League update form data
 * @param _originalLeague - Original league data (reserved for future comparison logic)
 */
export function buildUpdateLeagueFormData(
  form: UpdateLeagueForm,
  _originalLeague: League,
): FormData {
  const formData = new FormData();

  // Always include required fields if they are provided in the form
  if (form.name !== undefined) {
    formData.append('name', form.name);
  }

  if (form.timezone !== undefined) {
    formData.append('timezone', form.timezone || '');
  }

  if (form.visibility !== undefined) {
    formData.append('visibility', form.visibility);
  }

  if (form.contact_email !== undefined) {
    formData.append('contact_email', form.contact_email || '');
  }

  if (form.organizer_name !== undefined) {
    formData.append('organizer_name', form.organizer_name || '');
  }

  // File uploads (only if new file provided)
  if (form.logo && form.logo !== null) {
    formData.append('logo', form.logo);
  }

  if (form.banner && form.banner !== null) {
    formData.append('banner', form.banner);
  }

  if (form.header_image && form.header_image !== null) {
    formData.append('header_image', form.header_image);
  }

  // Platform IDs - only include if changed
  if (form.platform_ids !== undefined) {
    const originalIds = _originalLeague.platform_ids || [];
    const hasChanged =
      form.platform_ids.length !== originalIds.length ||
      form.platform_ids.some((id) => !originalIds.includes(id));

    if (hasChanged) {
      form.platform_ids.forEach((id) => {
        formData.append('platform_ids[]', id.toString());
      });
    }
  }

  // Optional text fields - include if provided
  if (form.tagline !== undefined) {
    formData.append('tagline', form.tagline || '');
  }

  if (form.description !== undefined) {
    formData.append('description', form.description || '');
  }

  // Social media fields - include if provided
  const socialFields: Array<keyof UpdateLeagueForm> = [
    'discord_url',
    'website_url',
    'twitter_handle',
    'instagram_handle',
    'youtube_url',
    'twitch_url',
  ];

  socialFields.forEach((field) => {
    const formValue = form[field];
    if (formValue !== undefined) {
      formData.append(field, (formValue as string) || '');
    }
  });

  return formData;
}

/**
 * Get driver columns configuration for a league's platforms
 * @param leagueId - League ID
 */
export async function getDriverColumns(leagueId: number): Promise<PlatformColumn[]> {
  const response: AxiosResponse<ApiResponse<PlatformColumn[]>> = await apiClient.get(
    API_ENDPOINTS.leagues.driverColumns(leagueId),
  );
  return response.data.data;
}

/**
 * Get driver form fields configuration for a league's platforms
 * @param leagueId - League ID
 */
export async function getDriverFormFields(leagueId: number): Promise<PlatformFormField[]> {
  const response: AxiosResponse<ApiResponse<PlatformFormField[]>> = await apiClient.get(
    API_ENDPOINTS.leagues.driverFormFields(leagueId),
  );
  return response.data.data;
}

/**
 * Get CSV headers for driver import for a league's platforms
 * @param leagueId - League ID
 */
export async function getDriverCsvHeaders(leagueId: number): Promise<PlatformCsvHeader[]> {
  const response: AxiosResponse<ApiResponse<PlatformCsvHeader[]>> = await apiClient.get(
    API_ENDPOINTS.leagues.driverCsvHeaders(leagueId),
  );
  return response.data.data;
}
