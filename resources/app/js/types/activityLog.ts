/**
 * Activity Log Types for App Dashboard
 */

/**
 * Log name - always 'league' for app dashboard activities
 */
export type LogName = 'league';

/**
 * Action types for activities
 */
export type ActivityAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'complete'
  | 'archive'
  | 'import'
  | 'add_driver'
  | 'remove_driver'
  | 'reorder'
  | 'enter_results';

/**
 * Entity types that can be tracked
 */
export type EntityType =
  | 'league'
  | 'driver'
  | 'competition'
  | 'season'
  | 'round'
  | 'race'
  | 'qualifier'
  | 'division'
  | 'team'
  | 'season_driver';

/**
 * Context information for the activity
 */
export interface ActivityContext {
  competition_id?: number;
  competition_name?: string;
  season_id?: number;
  season_name?: string;
  round_id?: number;
  round_name?: string;
  team_id?: number;
  team_name?: string;
  division_id?: number;
  division_name?: string;
}

/**
 * Changes recorded in the activity
 */
export interface ActivityChanges {
  old?: Record<string, unknown>;
  new?: Record<string, unknown>;
}

/**
 * Activity properties stored with each log entry
 */
export interface ActivityProperties {
  league_id: number;
  league_name: string;
  action: ActivityAction;
  entity_type: EntityType;
  entity_id: number;
  entity_name: string;
  context?: ActivityContext;
  changes?: ActivityChanges;
  ip_address?: string;
  user_agent?: string;
  [key: string]: unknown;
}

/**
 * Causer information (user who performed the action)
 */
export interface ActivityCauser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

/**
 * Single activity log entry
 */
export interface Activity {
  id: number;
  log_name: LogName;
  description: string;
  subject_type: string | null;
  subject_id: number | null;
  causer_type: string | null;
  causer_id: number | null;
  causer?: ActivityCauser | null;
  properties: ActivityProperties;
  event: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * API response for activity list
 */
export interface ActivityListResponse {
  success: boolean;
  data: Activity[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message?: string;
}

/**
 * API response for single activity
 */
export interface ActivityResponse {
  success: boolean;
  data: Activity;
  message?: string;
}

/**
 * Filter parameters for fetching activities
 */
export interface ActivityFilterParams {
  limit?: number;
  page?: number;
  entity_type?: EntityType;
  action?: ActivityAction;
  from_date?: string;
  to_date?: string;
}

/**
 * Formatted activity for display
 */
export interface FormattedActivity {
  id: number;
  description: string;
  icon: string;
  iconColor: string;
  causer: string;
  entityType: EntityType;
  entityName: string;
  action: ActivityAction;
  context: string;
  timestamp: string;
  relativeTime: string;
  changes?: ActivityChanges;
}
