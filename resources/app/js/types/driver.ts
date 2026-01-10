/**
 * Driver-related TypeScript types and interfaces
 */

/**
 * Driver status options for league association
 */
export type DriverStatus = 'active' | 'inactive' | 'banned';

/**
 * Global driver entity (drivers table)
 */
export interface Driver {
  id: number;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  discord_id: string | null;
  display_name: string;
  email: string | null;
  phone: string | null;
  psn_id: string | null;
  iracing_id: string | null;
  iracing_customer_id: number | null;
  primary_platform_id: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * League driver association (league_drivers pivot table)
 * Contains league-specific data and nested driver object
 */
export interface LeagueDriver {
  id: number;
  league_id: number;
  driver_id: number;
  driver_number: number | null;
  status: DriverStatus;
  league_notes: string | null;
  added_to_league_at: string;
  driver: Driver;
}

/**
 * Request payload for creating a new driver and adding to league
 */
export interface CreateDriverRequest {
  // Names (at least one of nickname or discord_id required)
  first_name?: string;
  last_name?: string;
  nickname?: string;
  discord_id?: string;

  // Contact info (optional)
  email?: string;
  phone?: string;

  // Platform IDs (at least one required)
  psn_id?: string;
  iracing_id?: string;
  iracing_customer_id?: number;

  // League-specific data
  driver_number?: number;
  status?: DriverStatus;
  league_notes?: string;
}

/**
 * Request payload for updating league-specific driver settings
 */
export interface UpdateLeagueDriverRequest {
  driver_number?: number | null;
  status?: DriverStatus;
  league_notes?: string | null;
}

/**
 * Request payload for updating both driver and league-specific settings
 */
export interface UpdateDriverRequest {
  // Global driver fields (optional - only update if provided)
  first_name?: string;
  last_name?: string;
  nickname?: string;
  discord_id?: string;
  email?: string;
  phone?: string;
  psn_id?: string;
  iracing_id?: string;
  iracing_customer_id?: number;
  // League-specific fields
  driver_number?: number | null;
  status?: DriverStatus;
  league_notes?: string | null;
}

/**
 * CSV import request payload
 */
export interface ImportDriversRequest {
  csv_data: string;
}

/**
 * CSV import response from backend (raw format)
 */
export interface ImportDriversBackendResponse {
  success_count: number;
  errors: Array<{ row: number; message: string }>; // [{ row: 2, message: "Row 2: Error message" }]
}

/**
 * CSV import response (transformed for frontend use)
 */
export interface ImportDriversResponse {
  success_count: number;
  errors: ImportError[];
}

/**
 * CSV import error details
 */
export interface ImportError {
  row: number;
  message: string;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number | null;
  to: number | null;
}

/**
 * Paginated drivers response
 */
export interface PaginatedDriversResponse {
  data: LeagueDriver[];
  meta: PaginationMeta;
}

/**
 * Query parameters for fetching league drivers
 */
export interface LeagueDriversQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: DriverStatus | 'all';
}

/**
 * Driver statistics summary
 */
export interface DriverStats {
  total: number;
  active: number;
  inactive: number;
  banned: number;
}

/**
 * Dynamic platform form data
 * Combines CreateDriverRequest with platform-specific fields
 */
export type DriverFormData = CreateDriverRequest & {
  [key: string]: string | number | undefined;
};

/**
 * League driver season data
 * Represents a driver's participation in a specific season
 */
export interface LeagueDriverSeasonData {
  season_id: number;
  season_name: string;
  season_slug: string;
  season_status: 'setup' | 'active' | 'completed' | 'archived';
  competition_id: number;
  competition_name: string;
  competition_slug: string;
  division_name: string | null;
  team_name: string | null;
  added_at: string;
}
