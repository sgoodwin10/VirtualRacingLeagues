/**
 * Race Result API Service
 * Handles all HTTP requests for race result management
 */

import { apiClient } from './api';
import type { RaceResult, BulkRaceResultsPayload } from '@app/types/raceResult';
import { API_ENDPOINTS } from '@app/constants/apiEndpoints';

/**
 * Get all results for a race
 * @param raceId - Race ID
 */
export async function getResults(raceId: number): Promise<RaceResult[]> {
  const response = await apiClient.get<{ data: RaceResult[] }>(API_ENDPOINTS.races.results(raceId));
  return response.data.data;
}

/**
 * Save/update results for a race (bulk operation)
 * Replaces all existing results
 * @param raceId - Race ID
 * @param payload - Bulk race results payload
 */
export async function saveResults(
  raceId: number,
  payload: BulkRaceResultsPayload,
): Promise<RaceResult[]> {
  const response = await apiClient.post<{ data: RaceResult[] }>(
    API_ENDPOINTS.races.results(raceId),
    payload,
  );
  return response.data.data;
}

/**
 * Delete all results for a race
 * @param raceId - Race ID
 */
export async function deleteResults(raceId: number): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.races.results(raceId));
}

interface GoogleSheetsCsvResponse {
  data: {
    csv: string;
  };
}

/**
 * Fetch a public Google Sheet as CSV data
 * @param url - The public Google Sheets URL
 */
export async function fetchGoogleSheetAsCsv(url: string): Promise<string> {
  const response = await apiClient.post<GoogleSheetsCsvResponse>('/google-sheets/fetch-csv', {
    url,
  });
  return response.data.data.csv;
}

/**
 * Grouped export for convenient importing
 */
const raceResultService = {
  getResults,
  saveResults,
  deleteResults,
  fetchGoogleSheetAsCsv,
};

export default raceResultService;
