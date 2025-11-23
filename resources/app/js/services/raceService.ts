import { apiClient } from './api';
import type { AxiosResponse } from 'axios';
import type { Race, CreateRaceRequest, UpdateRaceRequest } from '@app/types/race';
import { API_ENDPOINTS } from '@app/constants/apiEndpoints';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

// GET all races for a round (excludes qualifier)
export async function getRaces(roundId: number): Promise<Race[]> {
  const response: AxiosResponse<ApiResponse<Race[]>> = await apiClient.get(
    API_ENDPOINTS.rounds.races(roundId),
  );
  return response.data.data;
}

// GET qualifier for a round
export async function getQualifier(roundId: number): Promise<Race | null> {
  try {
    const response: AxiosResponse<ApiResponse<Race>> = await apiClient.get(
      API_ENDPOINTS.rounds.qualifier(roundId),
    );
    return response.data.data;
  } catch {
    // If 404, no qualifier exists for this round
    return null;
  }
}

// GET single race
export async function getRace(raceId: number): Promise<Race> {
  const response: AxiosResponse<ApiResponse<Race>> = await apiClient.get(
    API_ENDPOINTS.races.detail(raceId),
  );
  return response.data.data;
}

// POST create race
export async function createRace(roundId: number, data: CreateRaceRequest): Promise<Race> {
  const response: AxiosResponse<ApiResponse<Race>> = await apiClient.post(
    API_ENDPOINTS.rounds.races(roundId),
    data,
  );
  return response.data.data;
}

// PUT update race
export async function updateRace(raceId: number, data: UpdateRaceRequest): Promise<Race> {
  const response: AxiosResponse<ApiResponse<Race>> = await apiClient.put(
    API_ENDPOINTS.races.update(raceId),
    data,
  );
  return response.data.data;
}

// DELETE race
export async function deleteRace(raceId: number): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.races.delete(raceId));
}
