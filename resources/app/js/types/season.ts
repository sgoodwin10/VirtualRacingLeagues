/**
 * Season-related TypeScript types and interfaces
 */

import type { PaginationMeta } from './driver';
import type { MediaObject } from './media';

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
  // OLD FORMAT (backward compatibility)
  logo_url: string;
  // NEW FORMAT - responsive media
  logo?: MediaObject | null;
  competition_colour: string | null; // RGB JSON string: {"r":100,"g":102,"b":241}
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

  // Branding - OLD FORMAT (backward compatibility)
  logo_url: string; // Never null (resolves to competition logo if not set)
  has_own_logo: boolean;
  banner_url: string | null;
  has_own_banner: boolean;

  // Branding - NEW FORMAT (responsive media)
  logo?: MediaObject | null; // Responsive logo with multiple sizes
  banner?: MediaObject | null; // Responsive banner with multiple sizes

  // Settings
  race_divisions_enabled: boolean;
  team_championship_enabled: boolean;
  race_times_required: boolean;
  drop_round: boolean;
  total_drop_rounds: number;

  // Team Championship Settings
  teams_drivers_for_calculation: number | null;
  teams_drop_rounds: boolean;
  teams_total_drop_rounds: number | null;

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
 * Create season request (form input type - user may not provide)
 */
export interface CreateSeasonRequest {
  name: string;
  car_class?: string;
  description?: string;
  technical_specs?: string;
  logo?: File;
  banner?: File;
  race_divisions_enabled?: boolean;
  team_championship_enabled?: boolean;
  race_times_required?: boolean;
  drop_round?: boolean;
  total_drop_rounds?: number;
  teams_drivers_for_calculation?: number | null;
  teams_drop_rounds?: boolean;
  teams_total_drop_rounds?: number | null;
}

/**
 * Update season request (update/partial type)
 *
 * Nullability patterns:
 * - Fields that can be omitted: Not provided means "don't change this field"
 * - Fields that support null: Explicitly passing null means "clear this field"
 *   - car_class: Pass null to clear car class
 *   - description: Pass null to clear description
 *   - technical_specs: Pass null to clear technical specs
 *   - logo: Pass null to remove custom logo (reverts to competition logo)
 *   - banner: Pass null to remove banner
 * - Boolean fields: Cannot be null, omit to keep current value
 * - Number fields: Cannot be null, omit to keep current value
 */
export interface UpdateSeasonRequest {
  /** Season name (omit to keep current) */
  name?: string;
  /** Car class (omit to keep, null to clear) */
  car_class?: string | null;
  /** Description (omit to keep, null to clear) */
  description?: string | null;
  /** Technical specifications (omit to keep, null to clear) */
  technical_specs?: string | null;
  /** Logo file (omit to keep, null to remove custom logo and revert to competition logo) */
  logo?: File | null;
  /** Banner file (omit to keep, null to remove banner) */
  banner?: File | null;
  /** Enable race divisions (omit to keep current) */
  race_divisions_enabled?: boolean;
  /** Enable team championship (omit to keep current) */
  team_championship_enabled?: boolean;
  /** Require race times (omit to keep current) */
  race_times_required?: boolean;
  /** Enable drop round feature (omit to keep current) */
  drop_round?: boolean;
  /** Total number of drop rounds (omit to keep current) */
  total_drop_rounds?: number;
  /** Number of drivers for team calculation (omit to keep, null for all drivers) */
  teams_drivers_for_calculation?: number | null;
  /** Enable teams drop rounds (omit to keep current) */
  teams_drop_rounds?: boolean;
  /** Total number of team drop rounds (omit to keep, null to clear) */
  teams_total_drop_rounds?: number | null;
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
  race_divisions_enabled: boolean;
  team_championship_enabled: boolean;
  race_times_required: boolean;
  drop_round: boolean;
  total_drop_rounds: number;
  teams_drivers_for_calculation: number | null;
  teams_drop_rounds: boolean;
  teams_total_drop_rounds: number | null;
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
