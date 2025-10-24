/**
 * Season-related TypeScript types and interfaces
 */

import type { PaginationMeta } from './driver';

/**
 * Season status
 */
export type SeasonStatus = 'setup' | 'active' | 'completed' | 'archived';

/**
 * Competition reference (subset for season context)
 */
export interface SeasonCompetition {
  id: number;
  name: string;
  slug: string;
  platform_id: number;
  logo_url: string;
  platform?: {
    id: number;
    name: string;
    slug: string;
  };
  league?: {
    id: number;
    name: string;
    slug: string;
  };
}

/**
 * Main Season entity
 */
export interface Season {
  id: number;
  competition_id: number;
  competition?: SeasonCompetition; // Full nested competition with league

  // Backward compatibility: flat competition fields from backend DTO
  competition_name?: string;
  competition_slug?: string;

  // Basic info
  name: string;
  slug: string;
  car_class: string | null;
  description: string | null;
  technical_specs: string | null;

  // Branding
  logo_url: string; // Never null (resolves to competition logo if not set)
  has_own_logo: boolean;
  banner_url: string | null;
  has_own_banner: boolean;

  // Settings
  team_championship_enabled: boolean;

  // Status
  status: SeasonStatus;
  is_setup: boolean;
  is_active: boolean;
  is_completed: boolean;
  is_archived: boolean;
  is_deleted: boolean;

  // Dates
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  // Owner
  created_by_user_id: number;

  // Statistics (computed on backend)
  stats: SeasonStats;
}

/**
 * Season statistics
 * Current backend provides: total_drivers, active_drivers, total_races, completed_races
 * Additional fields may be added by backend (marked as optional)
 */
export interface SeasonStats {
  total_drivers: number;
  active_drivers: number;
  total_races: number;
  completed_races: number;
  // Optional fields that may be added by backend in the future
  reserve_drivers?: number;
  withdrawn_drivers?: number;
  total_divisions?: number;
  total_teams?: number;
  total_rounds?: number; // Alias for total_races (racing terminology)
  completed_rounds?: number; // Alias for completed_races
  next_round_date?: string | null;
}

/**
 * Create season request
 */
export interface CreateSeasonRequest {
  name: string;
  car_class?: string;
  description?: string;
  technical_specs?: string;
  logo?: File;
  banner?: File;
  team_championship_enabled?: boolean;
}

/**
 * Update season request
 */
export interface UpdateSeasonRequest {
  name?: string;
  car_class?: string | null;
  description?: string | null;
  technical_specs?: string | null;
  logo?: File | null;
  banner?: File | null;
  team_championship_enabled?: boolean;
}

/**
 * Season form state (internal)
 */
export interface SeasonForm {
  name: string;
  car_class: string;
  description: string;
  technical_specs: string;
  logo: File | null;
  logo_url: string | null;
  banner: File | null;
  banner_url: string | null;
  team_championship_enabled: boolean;
}

/**
 * Season form validation errors
 */
export interface SeasonFormErrors {
  name?: string;
  car_class?: string;
  description?: string;
  technical_specs?: string;
  logo?: string;
  banner?: string;
}

/**
 * Slug check response
 */
export interface SlugCheckResponse {
  available: boolean;
  slug: string;
  suggestion: string | null;
}

/**
 * Query parameters for fetching seasons
 */
export interface SeasonQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: SeasonStatus | 'all';
}

/**
 * Paginated seasons response
 */
export interface PaginatedSeasonsResponse {
  data: Season[];
  meta: PaginationMeta;
}
