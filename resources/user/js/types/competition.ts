/**
 * Competition-related TypeScript types and interfaces
 */

// Platform reference (subset of full Platform type)
export interface CompetitionPlatform {
  id: number;
  name: string;
  slug: string;
}

// League reference (subset of full League type)
export interface CompetitionLeague {
  id: number;
  name: string;
  slug: string;
}

// Status type
export type CompetitionStatus = 'active' | 'archived';

// Main Competition entity (from backend)
export interface Competition {
  id: number;
  league_id: number;
  name: string;
  slug: string;
  description: string | null;
  platform_id: number;
  platform?: CompetitionPlatform;
  league?: CompetitionLeague;
  logo_url: string; // Never null (backend resolves fallback)
  has_own_logo: boolean; // True if competition has its own logo, false if using league logo fallback
  status: CompetitionStatus;
  is_active: boolean;
  is_archived: boolean;
  is_deleted: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by_user_id: number;
  stats: CompetitionStats;
}

// Statistics (computed on backend)
export interface CompetitionStats {
  total_seasons: number;
  active_seasons: number;
  total_rounds: number;
  total_drivers: number;
  total_races: number;
  next_race_date: string | null;
}

// Create request payload
export interface CreateCompetitionRequest {
  name: string;
  platform_id: number;
  description?: string;
  logo?: File;
}

// Update request payload
export interface UpdateCompetitionRequest {
  name?: string;
  description?: string | null;
  logo?: File | null;
}

// Form state (internal)
export interface CompetitionForm {
  name: string;
  description: string;
  platform_id: number | null;
  logo: File | null;
  logo_url: string | null; // Existing logo URL for edit mode
}

// Validation errors
export interface CompetitionFormErrors {
  name?: string;
  description?: string;
  platform_id?: string;
  logo?: string;
}

// Slug check response (from backend)
export interface SlugCheckResponse {
  available: boolean;
  slug: string;
  suggestion: string | null; // e.g., "gt3-championship-02"
}

// Filters (for future use)
export interface CompetitionFilters {
  status?: CompetitionStatus | 'all';
  platform_id?: number;
  search?: string;
}
