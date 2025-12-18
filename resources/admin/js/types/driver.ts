export type DriverStatus = 'active' | 'inactive' | 'banned';

/**
 * Driver entity - represents a driver in the system
 */
export interface Driver {
  id: number;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  slug: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  psn_id: string | null;
  iracing_id: string | null;
  iracing_customer_id: number | null;
  discord_id: string | null;
  primary_platform_id: string;
  status: DriverStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Driver with user relationship (if linked to a user account)
 */
export interface DriverWithUser extends Driver {
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    status: string;
  } | null;
}

/**
 * Driver with detailed information including leagues, competitions, seasons
 */
export interface DriverDetails extends DriverWithUser {
  leagues: Array<{
    id: number;
    name: string;
    slug: string;
    // OLD - deprecated but kept for backward compatibility
    logo_url?: string | null;
    banner_url?: string | null;
    // NEW - responsive media objects
    logo?: import('./media').MediaObject | null;
    banner?: import('./media').MediaObject | null;
  }>;
  competitions: Array<{
    id: number;
    name: string;
    slug: string;
    platform_name: string;
    season_count: number;
    // OLD - deprecated but kept for backward compatibility
    logo_url?: string | null;
    banner_url?: string | null;
    // NEW - responsive media objects
    logo?: import('./media').MediaObject | null;
    banner?: import('./media').MediaObject | null;
  }>;
  seasons: Array<{
    id: number;
    name: string;
    competition_name: string;
    status: string;
    division_name: string | null;
    team_name: string | null;
    // OLD - deprecated but kept for backward compatibility
    logo_url?: string | null;
    banner_url?: string | null;
    // NEW - responsive media objects
    logo?: import('./media').MediaObject | null;
    banner?: import('./media').MediaObject | null;
  }>;
  race_stats: {
    total_races: number;
    total_wins: number;
    total_podiums: number;
    total_poles: number;
    best_finish: number | null;
  };
}

/**
 * DTO for creating a new driver
 */
export interface CreateDriverDTO {
  first_name?: string | null;
  last_name?: string | null;
  nickname?: string | null;
  email?: string | null;
  phone?: string | null;
  psn_id?: string | null;
  iracing_id?: string | null;
  iracing_customer_id?: number | null;
  discord_id?: string | null;
}

/**
 * DTO for updating an existing driver
 */
export interface UpdateDriverDTO {
  first_name?: string | null;
  last_name?: string | null;
  nickname?: string | null;
  email?: string | null;
  phone?: string | null;
  psn_id?: string | null;
  iracing_id?: string | null;
  iracing_customer_id?: number | null;
  discord_id?: string | null;
}

/**
 * Request parameters for fetching drivers
 */
export interface DriverListParams {
  search?: string;
  page?: number;
  per_page?: number;
  order_by?: 'created_at' | 'updated_at' | 'first_name' | 'last_name' | 'nickname' | 'email';
  order_direction?: 'asc' | 'desc';
}

/**
 * Paginated response for driver list
 */
export interface PaginatedDriverResponse {
  current_page: number;
  data: Driver[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Array<{ url: string | null; label: string; active: boolean }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

/**
 * API Response wrapper for driver operations
 */
export interface DriverApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
