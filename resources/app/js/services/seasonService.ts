/**
 * Season API Service
 * Handles all HTTP requests for season management
 */

import { apiClient } from './api';
import type {
  Season,
  CreateSeasonRequest,
  UpdateSeasonRequest,
  SeasonQueryParams,
  SlugCheckResponse,
  TiebreakerRule,
  SeasonTiebreakerRule,
} from '@app/types/season';
import type { SeasonStandingsResponse } from '@app/types/seasonStandings';
import type { AxiosResponse } from 'axios';
import { API_ENDPOINTS } from '@app/constants/apiEndpoints';
import {
  appendIfDefined,
  appendFileIfProvided,
  addMethodSpoofing,
} from '@app/utils/formDataBuilder';
import type { ApiResponse } from '@app/types/api';

/**
 * Get all seasons for a competition
 * Note: Backend returns all seasons as a simple array, not paginated
 */
export async function getSeasons(
  competitionId: number,
  params?: SeasonQueryParams,
): Promise<Season[]> {
  const response: AxiosResponse<ApiResponse<Season[]>> = await apiClient.get(
    API_ENDPOINTS.competitions.seasons(competitionId),
    { params },
  );
  return response.data.data;
}

/**
 * Get a single season by ID
 */
export async function getSeasonById(seasonId: number): Promise<Season> {
  const response: AxiosResponse<ApiResponse<Season>> = await apiClient.get(
    API_ENDPOINTS.seasons.detail(seasonId),
  );
  return response.data.data;
}

/**
 * Create a new season
 */
export async function createSeason(competitionId: number, formData: FormData): Promise<Season> {
  const response: AxiosResponse<ApiResponse<Season>> = await apiClient.post(
    API_ENDPOINTS.competitions.seasons(competitionId),
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
 * Update season
 */
export async function updateSeason(seasonId: number, formData: FormData): Promise<Season> {
  // Laravel method spoofing for PUT with multipart/form-data
  addMethodSpoofing(formData, 'PUT');

  const response: AxiosResponse<ApiResponse<Season>> = await apiClient.post(
    API_ENDPOINTS.seasons.update(seasonId),
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
 * Archive season
 */
export async function archiveSeason(seasonId: number): Promise<Season> {
  const response: AxiosResponse<ApiResponse<Season>> = await apiClient.post(
    API_ENDPOINTS.seasons.archive(seasonId),
  );
  return response.data.data;
}

/**
 * Unarchive season
 */
export async function unarchiveSeason(seasonId: number): Promise<Season> {
  const response: AxiosResponse<ApiResponse<Season>> = await apiClient.post(
    API_ENDPOINTS.seasons.unarchive(seasonId),
  );
  return response.data.data;
}

/**
 * Activate season
 */
export async function activateSeason(seasonId: number): Promise<Season> {
  const response: AxiosResponse<ApiResponse<Season>> = await apiClient.post(
    API_ENDPOINTS.seasons.activate(seasonId),
  );
  return response.data.data;
}

/**
 * Complete season
 */
export async function completeSeason(seasonId: number): Promise<Season> {
  const response: AxiosResponse<ApiResponse<Season>> = await apiClient.post(
    API_ENDPOINTS.seasons.complete(seasonId),
  );
  return response.data.data;
}

/**
 * Reactivate season
 */
export async function reactivateSeason(seasonId: number): Promise<Season> {
  const response: AxiosResponse<ApiResponse<Season>> = await apiClient.post(
    API_ENDPOINTS.seasons.reactivate(seasonId),
  );
  return response.data.data;
}

/**
 * Delete season (soft delete)
 */
export async function deleteSeason(seasonId: number): Promise<void> {
  await apiClient.delete(API_ENDPOINTS.seasons.delete(seasonId));
}

/**
 * Restore deleted season
 */
export async function restoreSeason(seasonId: number): Promise<Season> {
  const response: AxiosResponse<ApiResponse<Season>> = await apiClient.post(
    API_ENDPOINTS.seasons.restore(seasonId),
  );
  return response.data.data;
}

/**
 * Check slug availability
 */
export async function checkSeasonSlugAvailability(
  competitionId: number,
  name: string,
  excludeSeasonId?: number,
  signal?: AbortSignal,
): Promise<SlugCheckResponse> {
  const response: AxiosResponse<ApiResponse<SlugCheckResponse>> = await apiClient.post(
    API_ENDPOINTS.competitions.checkSeasonSlug(competitionId),
    { name, exclude_id: excludeSeasonId },
    { signal },
  );
  return response.data.data;
}

/**
 * Get season standings (cumulative driver standings across all rounds)
 */
export async function getSeasonStandings(seasonId: number): Promise<SeasonStandingsResponse> {
  const response: AxiosResponse<ApiResponse<SeasonStandingsResponse>> = await apiClient.get(
    API_ENDPOINTS.seasons.standings(seasonId),
  );
  return response.data.data;
}

/**
 * Build FormData from create season request
 */
export function buildCreateSeasonFormData(data: CreateSeasonRequest): FormData {
  const formData = new FormData();

  appendIfDefined(formData, 'name', data.name);
  appendIfDefined(formData, 'car_class', data.car_class);
  appendIfDefined(formData, 'description', data.description);
  appendIfDefined(formData, 'technical_specs', data.technical_specs);
  appendFileIfProvided(formData, 'logo', data.logo);
  appendFileIfProvided(formData, 'banner', data.banner);
  appendIfDefined(formData, 'race_divisions_enabled', data.race_divisions_enabled);
  appendIfDefined(formData, 'team_championship_enabled', data.team_championship_enabled);
  appendIfDefined(formData, 'race_times_required', data.race_times_required);
  appendIfDefined(formData, 'drop_round', data.drop_round);
  appendIfDefined(formData, 'total_drop_rounds', data.total_drop_rounds);
  appendIfDefined(formData, 'teams_drivers_for_calculation', data.teams_drivers_for_calculation);
  appendIfDefined(formData, 'teams_drop_rounds', data.teams_drop_rounds);
  appendIfDefined(formData, 'teams_total_drop_rounds', data.teams_total_drop_rounds);
  appendIfDefined(
    formData,
    'round_totals_tiebreaker_rules_enabled',
    data.round_totals_tiebreaker_rules_enabled,
  );

  return formData;
}

/**
 * Build FormData from update season request
 *
 * NOTE: Empty strings are used to clear optional text fields.
 * - If a field is undefined, it won't be sent to the backend (no update)
 * - If a field is null or empty string '', it will be sent as '' (clears the field)
 * - File fields (logo, banner) are only sent if they are File objects
 *
 * This allows partial updates while also supporting field clearing.
 */
export function buildUpdateSeasonFormData(data: UpdateSeasonRequest): FormData {
  const formData = new FormData();

  appendIfDefined(formData, 'name', data.name);
  appendIfDefined(formData, 'car_class', data.car_class);
  appendIfDefined(formData, 'description', data.description);
  appendIfDefined(formData, 'technical_specs', data.technical_specs);
  appendFileIfProvided(formData, 'logo', data.logo);
  appendFileIfProvided(formData, 'banner', data.banner);
  appendIfDefined(formData, 'race_divisions_enabled', data.race_divisions_enabled);
  appendIfDefined(formData, 'team_championship_enabled', data.team_championship_enabled);
  appendIfDefined(formData, 'race_times_required', data.race_times_required);
  appendIfDefined(formData, 'drop_round', data.drop_round);
  appendIfDefined(formData, 'total_drop_rounds', data.total_drop_rounds);
  appendIfDefined(formData, 'teams_drivers_for_calculation', data.teams_drivers_for_calculation);
  appendIfDefined(formData, 'teams_drop_rounds', data.teams_drop_rounds);
  appendIfDefined(formData, 'teams_total_drop_rounds', data.teams_total_drop_rounds);
  appendIfDefined(
    formData,
    'round_totals_tiebreaker_rules_enabled',
    data.round_totals_tiebreaker_rules_enabled,
  );

  return formData;
}

/**
 * Get all available tiebreaker rules
 */
export async function getTiebreakerRules(): Promise<TiebreakerRule[]> {
  const response: AxiosResponse<ApiResponse<TiebreakerRule[]>> = await apiClient.get(
    API_ENDPOINTS.tiebreakerRules.list(),
  );
  return response.data.data;
}

/**
 * API response structure for season tiebreaker rules
 */
interface SeasonTiebreakerRulesResponse {
  enabled: boolean;
  rules: Array<{
    id: number;
    slug: string;
    order: number;
  }>;
}

/**
 * Get tiebreaker rules configured for a specific season
 */
export async function getSeasonTiebreakerRules(seasonId: number): Promise<SeasonTiebreakerRule[]> {
  const response: AxiosResponse<ApiResponse<SeasonTiebreakerRulesResponse>> = await apiClient.get(
    API_ENDPOINTS.tiebreakerRules.forSeason(seasonId),
  );

  // Extract rules from the response and map to SeasonTiebreakerRule format
  const data = response.data.data;
  return data.rules.map((rule) => ({
    id: rule.id,
    season_id: seasonId,
    rule_id: rule.id,
    rule_name: '', // Will be populated by the store from available rules
    rule_slug: rule.slug,
    rule_description: null,
    order: rule.order,
  }));
}

/**
 * Update the order of tiebreaker rules for a season
 */
export async function updateSeasonTiebreakerRulesOrder(
  seasonId: number,
  ruleOrder: { id: number; order: number }[],
): Promise<void> {
  await apiClient.put(API_ENDPOINTS.tiebreakerRules.updateOrder(seasonId), {
    rules: ruleOrder,
  });
}

/**
 * Response structure for recalculate results endpoint
 */
export interface RecalculateResultsResponse {
  recalculated_count: number;
  round_ids: number[];
}

/**
 * Recalculate results for all completed rounds in a season
 */
export async function recalculateSeasonResults(
  seasonId: number,
): Promise<RecalculateResultsResponse> {
  const response: AxiosResponse<ApiResponse<RecalculateResultsResponse>> = await apiClient.post(
    API_ENDPOINTS.seasons.recalculateResults(seasonId),
  );
  return response.data.data;
}
