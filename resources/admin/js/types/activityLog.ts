/**
 * Activity Log Types
 * Type definitions for activity logging system
 */

/**
 * Log name enum
 */
export type LogName = 'user' | 'admin';

/**
 * Event type enum
 */
export type EventType = 'created' | 'updated' | 'deleted';

/**
 * Activity log properties interface
 * Contains additional metadata and changes
 */
export interface ActivityProperties {
  // Changed attributes (for updates)
  attributes?: Record<string, unknown>;
  old?: Record<string, unknown>;

  // Additional metadata
  ip_address?: string;
  user_agent?: string;
  reason?: string;
  action?: string;
  [key: string]: unknown;
}

/**
 * Causer information (User or Admin who caused the activity)
 */
export interface Causer {
  id: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  type: string; // Model class name
}

/**
 * Subject information (Model that was acted upon)
 */
export interface Subject {
  id: number;
  type: string; // Model class name
  [key: string]: unknown;
}

/**
 * Activity log interface
 * Matches the Spatie ActivityLog structure
 */
export interface Activity {
  id: number;
  log_name: LogName;
  description: string;
  subject_type: string | null;
  subject_id: number | null;
  subject?: Subject | null;
  causer_type: string | null;
  causer_id: number | null;
  causer?: Causer | null;
  properties: ActivityProperties;
  event: EventType | null;
  batch_uuid: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Activity list response interface
 */
export interface ActivityListResponse {
  success: boolean;
  data: Activity[];
  message?: string;
}

/**
 * Single activity response interface
 */
export interface ActivityResponse {
  success: boolean;
  data: Activity;
  message?: string;
}

/**
 * Clean activities response interface
 */
export interface CleanActivitiesResponse {
  success: boolean;
  message: string;
  deleted_count: number;
}

/**
 * Activity filter parameters
 */
export interface ActivityFilterParams {
  limit?: number;
  log_name?: LogName;
  event?: EventType;
  from_date?: string;
  to_date?: string;
  causer_id?: number;
  subject_id?: number;
}

/**
 * Helper type for activity changes
 */
export interface ActivityChanges {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}
