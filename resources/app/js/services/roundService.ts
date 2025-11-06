import { apiClient } from './api';
import type { AxiosResponse } from 'axios';
import type {
  Round,
  CreateRoundRequest,
  UpdateRoundRequest,
  NextRoundNumberResponse,
} from '@app/types/round';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

export async function getRounds(seasonId: number): Promise<Round[]> {
  const response: AxiosResponse<ApiResponse<Round[]>> = await apiClient.get(
    `/seasons/${seasonId}/rounds`,
  );
  return response.data.data;
}

export async function getRound(roundId: number): Promise<Round> {
  const response: AxiosResponse<ApiResponse<Round>> = await apiClient.get(`/rounds/${roundId}`);
  return response.data.data;
}

export async function createRound(seasonId: number, data: CreateRoundRequest): Promise<Round> {
  const response: AxiosResponse<ApiResponse<Round>> = await apiClient.post(
    `/seasons/${seasonId}/rounds`,
    data,
  );
  return response.data.data;
}

export async function updateRound(roundId: number, data: UpdateRoundRequest): Promise<Round> {
  const response: AxiosResponse<ApiResponse<Round>> = await apiClient.put(
    `/rounds/${roundId}`,
    data,
  );

  return response.data.data;
}

export async function deleteRound(roundId: number): Promise<void> {
  await apiClient.delete(`/rounds/${roundId}`);
}

export async function getNextRoundNumber(seasonId: number): Promise<number> {
  const response: AxiosResponse<ApiResponse<NextRoundNumberResponse>> = await apiClient.get(
    `/seasons/${seasonId}/rounds/next-number`,
  );
  return response.data.data.next_round_number;
}
