import { apiClient } from './api';
import type { RaceResult, BulkRaceResultsPayload } from '@app/types/raceResult';

const BASE_URL = '/races';

export const raceResultService = {
  /**
   * Get all results for a race
   */
  async getResults(raceId: number): Promise<RaceResult[]> {
    const response = await apiClient.get<{ data: RaceResult[] }>(`${BASE_URL}/${raceId}/results`);
    return response.data.data;
  },

  /**
   * Save/update results for a race (bulk operation)
   * Replaces all existing results
   */
  async saveResults(raceId: number, payload: BulkRaceResultsPayload): Promise<RaceResult[]> {
    const response = await apiClient.post<{ data: RaceResult[] }>(
      `${BASE_URL}/${raceId}/results`,
      payload,
    );
    return response.data.data;
  },

  /**
   * Delete all results for a race
   */
  async deleteResults(raceId: number): Promise<void> {
    await apiClient.delete(`${BASE_URL}/${raceId}/results`);
  },
};

export default raceResultService;
