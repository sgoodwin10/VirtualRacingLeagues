import { apiClient } from './api';
import type { AxiosResponse } from 'axios';
import type { Race, CreateRaceRequest, UpdateRaceRequest } from '@user/types/race';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

// GET all races for a round (excludes qualifier)
export async function getRaces(roundId: number): Promise<Race[]> {
  const response: AxiosResponse<ApiResponse<Race[]>> = await apiClient.get(
    `/rounds/${roundId}/races`,
  );
  return response.data.data;
}

// GET qualifier for a round
export async function getQualifier(roundId: number): Promise<Race | null> {
  try {
    const response: AxiosResponse<ApiResponse<Race>> = await apiClient.get(
      `/rounds/${roundId}/qualifier`,
    );
    return response.data.data;
  } catch {
    // If 404, no qualifier exists for this round
    return null;
  }
}

// GET single race
export async function getRace(raceId: number): Promise<Race> {
  const response: AxiosResponse<ApiResponse<Race>> = await apiClient.get(`/races/${raceId}`);
  return response.data.data;
}

// POST create race
export async function createRace(roundId: number, data: CreateRaceRequest): Promise<Race> {
  const response: AxiosResponse<ApiResponse<Race>> = await apiClient.post(
    `/rounds/${roundId}/races`,
    data,
  );
  return response.data.data;
}

// PUT update race
export async function updateRace(raceId: number, data: UpdateRaceRequest): Promise<Race> {
  const response: AxiosResponse<ApiResponse<Race>> = await apiClient.put(`/races/${raceId}`, data);
  return response.data.data;
}

// DELETE race
export async function deleteRace(raceId: number): Promise<void> {
  await apiClient.delete(`/races/${raceId}`);
}
