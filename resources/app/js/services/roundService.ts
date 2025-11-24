import { apiClient } from './api';
import type { AxiosResponse } from 'axios';
import type {
  Round,
  CreateRoundRequest,
  UpdateRoundRequest,
  NextRoundNumberResponse,
} from '@app/types/round';
import { API_ENDPOINTS } from '@app/constants/apiEndpoints';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

export async function getRounds(seasonId: number): Promise<Round[]> {
  const response: AxiosResponse<ApiResponse<Round[]>> = await apiClient.get(
    API_ENDPOINTS.seasons.rounds(seasonId),
  );
  return response.data.data;
}

export async function getRound(roundId: number): Promise<Round> {
  const response: AxiosResponse<ApiResponse<Round>> = await apiClient.get(
    API_ENDPOINTS.rounds.detail(roundId),
  );
  return response.data.data;
}

export async function createRound(seasonId: number, data: CreateRoundRequest): Promise<Round> {
  const response: AxiosResponse<ApiResponse<Round>> = await apiClient.post(
    API_ENDPOINTS.seasons.rounds(seasonId),
    data,
  );
  return response.data.data;
}

export async function updateRound(roundId: number, data: UpdateRoundRequest): Promise<Round> {
  const response: AxiosResponse<ApiResponse<Round>> = await apiClient.put(
    API_ENDPOINTS.rounds.update(roundId),
    data,
  );

  return response.data.data;
}

export async function deleteRound(roundId: number): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.rounds.delete(roundId));
}

export async function getNextRoundNumber(seasonId: number): Promise<number> {
  const response: AxiosResponse<ApiResponse<NextRoundNumberResponse>> = await apiClient.get(
    API_ENDPOINTS.seasons.nextRoundNumber(seasonId),
  );
  return response.data.data.next_round_number;
}

export async function completeRound(roundId: number): Promise<Round> {
  const response: AxiosResponse<ApiResponse<Round>> = await apiClient.put(
    API_ENDPOINTS.rounds.complete(roundId),
  );
  return response.data.data;
}

export async function uncompleteRound(roundId: number): Promise<Round> {
  const response: AxiosResponse<ApiResponse<Round>> = await apiClient.put(
    API_ENDPOINTS.rounds.uncomplete(roundId),
  );
  return response.data.data;
}
