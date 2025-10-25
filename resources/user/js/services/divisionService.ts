/**
 * Division API Service
 * Handles all HTTP requests for division management
 */

import { apiClient } from './api';
import type {
  Division,
  CreateDivisionPayload,
  UpdateDivisionPayload,
  AssignDriverDivisionPayload,
} from '@user/types/division';
import type { AxiosResponse } from 'axios';

// API response wrapper
interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Driver count response
interface DriverCountResponse {
  count: number;
}

/**
 * Get all divisions for a season
 */
export async function getDivisions(seasonId: number): Promise<Division[]> {
  const response: AxiosResponse<ApiResponse<Division[]>> = await apiClient.get(
    `/seasons/${seasonId}/divisions`,
  );
  return response.data.data;
}

/**
 * Create a new division
 */
export async function createDivision(seasonId: number, formData: FormData): Promise<Division> {
  const response: AxiosResponse<ApiResponse<Division>> = await apiClient.post(
    `/seasons/${seasonId}/divisions`,
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
 * Update division
 */
export async function updateDivision(
  seasonId: number,
  divisionId: number,
  formData: FormData,
): Promise<Division> {
  // Laravel method spoofing for PUT with multipart/form-data
  formData.append('_method', 'PUT');

  const response: AxiosResponse<ApiResponse<Division>> = await apiClient.post(
    `/seasons/${seasonId}/divisions/${divisionId}`,
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
 * Delete division (hard delete)
 */
export async function deleteDivision(seasonId: number, divisionId: number): Promise<void> {
  await apiClient.delete(`/seasons/${seasonId}/divisions/${divisionId}`);
}

/**
 * Get driver count for a division
 */
export async function getDriverCount(seasonId: number, divisionId: number): Promise<number> {
  const response: AxiosResponse<ApiResponse<DriverCountResponse>> = await apiClient.get(
    `/seasons/${seasonId}/divisions/${divisionId}/driver-count`,
  );
  return response.data.data.count;
}

/**
 * Assign driver to division
 */
export async function assignDriverDivision(
  seasonId: number,
  seasonDriverId: number,
  payload: AssignDriverDivisionPayload,
): Promise<void> {
  await apiClient.put(`/seasons/${seasonId}/drivers/${seasonDriverId}/division`, payload);
}

/**
 * Build FormData from create division payload
 */
export function buildCreateDivisionFormData(data: CreateDivisionPayload): FormData {
  const formData = new FormData();

  formData.append('name', data.name);

  if (data.description) {
    formData.append('description', data.description);
  }

  if (data.logo) {
    formData.append('logo', data.logo);
  }

  return formData;
}

/**
 * Build FormData from update division payload
 */
export function buildUpdateDivisionFormData(data: UpdateDivisionPayload): FormData {
  const formData = new FormData();

  if (data.name !== undefined) {
    formData.append('name', data.name);
  }

  if (data.description !== undefined) {
    if (data.description === null) {
      formData.append('description', '');
    } else {
      formData.append('description', data.description);
    }
  }

  // Only send if it's an actual File object (new upload)
  if (data.logo !== undefined && data.logo !== null) {
    formData.append('logo', data.logo);
  }

  return formData;
}
