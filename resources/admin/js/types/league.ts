import type { PaginatedResponse, ApiResponse } from './api';
import type { MediaObject } from './media';

export type LeagueVisibility = 'public' | 'private' | 'unlisted';
export type LeagueStatus = 'active' | 'archived';
export type CompetitionStatus = 'active' | 'archived';

export interface CompetitionSummary {
  id: number;
  name: string;
  slug: string;
  status: CompetitionStatus;
  platform_id: number;
  platform_name: string;
  platform_slug: string;
  season_count: number;
  // OLD - deprecated but kept for backward compatibility
  logo_url?: string | null;
  banner_url?: string | null;
  // NEW - responsive media objects
  logo?: MediaObject | null;
  banner?: MediaObject | null;
  created_at: string;
}

export interface SeasonsSummary {
  total: number;
  active: number;
  completed: number;
}

export type SeasonStatus = 'pending' | 'active' | 'completed' | 'cancelled';

export interface Season {
  id: number;
  name: string;
  slug: string;
  competition_id: number;
  competition_name: string;
  status: SeasonStatus;
  division_name: string | null;
  team_name: string | null;
  // OLD - deprecated but kept for backward compatibility
  logo_url?: string | null;
  banner_url?: string | null;
  // NEW - responsive media objects
  logo?: MediaObject | null;
  banner?: MediaObject | null;
  created_at: string;
  updated_at: string;
}

export interface LeagueStats {
  total_drivers: number;
  total_races: number;
  total_competitions: number;
}

export interface League {
  id: number;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  // OLD - deprecated but kept for backward compatibility
  logo_url: string;
  header_image_url: string | null;
  banner_url?: string | null;
  // NEW - responsive media objects
  logo?: MediaObject | null;
  header_image?: MediaObject | null;
  banner?: MediaObject | null;
  platform_ids: number[];
  platforms: Array<{ id: number; name: string; slug: string }>;
  discord_url: string | null;
  website_url: string | null;
  twitter_handle: string | null;
  instagram_handle: string | null;
  youtube_url: string | null;
  twitch_url: string | null;
  visibility: LeagueVisibility;
  timezone: string | null;
  owner_user_id: number;
  owner?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  contact_email: string | null;
  organizer_name: string | null;
  status: LeagueStatus;
  is_active: boolean;
  is_archived: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface LeagueDetails extends League {
  competitions?: CompetitionSummary[];
  seasons_summary?: SeasonsSummary;
  stats?: LeagueStats;
}

export interface LeagueListParams {
  page?: number;
  per_page?: number;
  search?: string;
  visibility?: LeagueVisibility | 'all';
  status?: LeagueStatus | 'all';
  platform_ids?: number[];
  sort_by?: 'id' | 'name' | 'visibility' | 'status';
  sort_direction?: 'asc' | 'desc';
}

// Re-export for backward compatibility
export type { PaginatedResponse, ApiResponse };
