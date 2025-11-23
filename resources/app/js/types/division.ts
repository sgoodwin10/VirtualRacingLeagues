/**
 * Division-related TypeScript types and interfaces
 */

/**
 * Main Division entity
 */
export interface Division {
  id: number;
  season_id: number;
  name: string;
  description: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Create division request (form input type - user may not provide)
 */
export interface CreateDivisionPayload {
  name: string;
  description?: string;
  logo?: File;
}

/**
 * Update division request
 */
export interface UpdateDivisionPayload {
  name?: string;
  description?: string | null;
  logo?: File | null;
}

/**
 * Assign driver to division request
 */
export interface AssignDriverDivisionPayload {
  division_id: number | null; // null means "No Division"
}

/**
 * Division form state (internal)
 */
export interface DivisionForm {
  name: string;
  description: string;
  logo: File | null;
  logo_url: string | null;
}

/**
 * Division form validation errors
 */
export interface DivisionFormErrors {
  name?: string;
  description?: string;
  logo?: string;
}
