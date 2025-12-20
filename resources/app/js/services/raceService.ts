import { apiClient } from './api';
import type { AxiosResponse } from 'axios';
import type {
  Race,
  CreateRaceRequest,
  UpdateRaceRequest,
  OrphanedResultsResponse,
} from '@app/types/race';
import { API_ENDPOINTS } from '@app/constants/apiEndpoints';
import type { ApiResponse } from '@app/types/api';

// GET all races for a round (excludes qualifier)
export async function getRaces(roundId: number): Promise<Race[]> {
  const response: AxiosResponse<ApiResponse<Race[]>> = await apiClient.get(
    API_ENDPOINTS.rounds.races(roundId),
  );
  return response.data.data;
}

// GET qualifier for a round
export async function getQualifier(roundId: number): Promise<Race> {
  const response: AxiosResponse<ApiResponse<Race>> = await apiClient.get(
    API_ENDPOINTS.rounds.qualifier(roundId),
  );
  return response.data.data;
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

// PUT update qualifier
export async function updateQualifier(qualifierId: number, data: UpdateRaceRequest): Promise<Race> {
  const response: AxiosResponse<ApiResponse<Race>> = await apiClient.put(
    API_ENDPOINTS.qualifiers.update(qualifierId),
    data,
  );
  return response.data.data;
}

// DELETE race
export async function deleteRace(raceId: number): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.races.delete(raceId));
}

// DELETE qualifier
export async function deleteQualifier(qualifierId: number): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.qualifiers.delete(qualifierId));
}

// GET orphaned results for a race
export async function getOrphanedResults(raceId: number): Promise<OrphanedResultsResponse> {
  const response: AxiosResponse<ApiResponse<OrphanedResultsResponse>> = await apiClient.get(
    API_ENDPOINTS.races.orphanedResults(raceId),
  );
  return response.data.data;
}

// DELETE orphaned results for a race
export async function deleteOrphanedResults(raceId: number): Promise<{ message: string }> {
  const response: AxiosResponse<ApiResponse<{ message: string }>> = await apiClient.delete(
    API_ENDPOINTS.races.orphanedResults(raceId),
  );
  return response.data.data;
}
