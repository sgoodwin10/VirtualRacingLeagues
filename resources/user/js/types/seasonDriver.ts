/**
 * Season-Driver assignment TypeScript types and interfaces
 */

import type { PaginationMeta } from './driver';

/**
 * Available driver (simplified structure from backend)
 * Used for displaying drivers that can be added to a season
 */
export interface AvailableDriver {
  id: number; // League driver ID
  driver_id: number; // Global driver ID
  driver_name: string; // Computed display name from backend
  number: string | null; // Driver number
  team_name: string | null; // Team name
  psn_id: string | null; // PlayStation Network ID
  iracing_id: string | null; // iRacing ID
  discord_id: string | null; // Discord ID
}

/**
 * Paginated available drivers response
 */
export interface PaginatedAvailableDriversResponse {
  data: AvailableDriver[];
  meta: PaginationMeta;
}

/**
 * Season-driver status
 */
export type SeasonDriverStatus = 'active' | 'reserve' | 'withdrawn';

/**
 * Season-driver pivot entity
 * Backend returns flat structure with driver data embedded
 */
export interface SeasonDriver {
  id: number; // Season-driver pivot table ID
  season_id: number;
  league_driver_id: number;

  // Driver data (flattened from backend)
  driver_id: number;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  driver_number: string | null;
  psn_id: string | null;
  iracing_id: string | null;
  discord_id: string | null;
  team_name: string | null;

  // Season-specific metadata
  status: SeasonDriverStatus;
  notes: string | null; // Internal notes

  // Computed boolean fields
  is_active: boolean;
  is_reserve: boolean;
  is_withdrawn: boolean;

  // Dates
  added_at: string;
  updated_at: string;
}

/**
 * Add driver to season request
 */
export interface AddDriverToSeasonRequest {
  league_driver_id: number;
  status?: SeasonDriverStatus; // Default: 'active'
  notes?: string;
  division_id?: number;
  team_id?: number;
}

/**
 * Update season-driver request
 */
export interface UpdateSeasonDriverRequest {
  status?: SeasonDriverStatus;
  notes?: string | null;
  division_id?: number | null;
  team_id?: number | null;
}

/**
 * Season-driver form (for add/edit dialog)
 */
export interface SeasonDriverForm {
  status: SeasonDriverStatus;
  notes: string;
}

/**
 * Season-driver form errors
 */
export interface SeasonDriverFormErrors {
  status?: string;
  notes?: string;
}

/**
 * Season-driver statistics
 */
export interface SeasonDriverStats {
  total: number;
  active: number;
  reserve: number;
  withdrawn: number;
  unassigned_to_division: number;
  unassigned_to_team: number;
}

/**
 * Query parameters for fetching season drivers
 */
export interface SeasonDriverQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: SeasonDriverStatus | 'all';
  division_id?: number;
  team_id?: number;
}

/**
 * Paginated season drivers response
 */
export interface PaginatedSeasonDriversResponse {
  data: SeasonDriver[];
  meta: PaginationMeta;
}
