/**
 * Team-related TypeScript types and interfaces
 */

import type { MediaObject } from './media';

/**
 * Main Team entity
 */
export interface Team {
  id: number;
  season_id: number;
  name: string;
  // OLD FORMAT (backward compatibility)
  logo_url: string | null;
  // NEW FORMAT - responsive media
  logo?: MediaObject | null;
  created_at: string;
  updated_at: string;
}

/**
 * Create team request
 */
export interface CreateTeamPayload {
  name: string;
  logo?: File;
}

/**
 * Update team request
 */
export interface UpdateTeamPayload {
  name?: string;
  logo?: File | null;
}

/**
 * Assign driver to team request
 */
export interface AssignDriverTeamPayload {
  team_id: number | null; // null means "Privateer"
}

/**
 * Team form state (internal)
 */
export interface TeamForm {
  name: string;
  logo: File | null;
  logo_url: string | null;
}

/**
 * Team form validation errors
 */
export interface TeamFormErrors {
  name?: string;
  logo?: string;
}
