export type LeagueVisibility = 'public' | 'private' | 'unlisted';
export type LeagueStatus = 'active' | 'archived';

export interface League {
  id: number;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  logo_url: string;
  header_image_url: string | null;
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
    id: string;
    first_name: string;
    last_name: string;
    name?: string;
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

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
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

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
