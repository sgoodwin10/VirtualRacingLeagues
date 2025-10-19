/**
 * League-related TypeScript types and interfaces
 */

/**
 * Platform interface representing a racing simulation platform
 */
export interface Platform {
  id: number;
  name: string;
  slug: string;
}

/**
 * Timezone interface
 */
export interface Timezone {
  value: string;
  label: string;
}

/**
 * League visibility options
 */
export type LeagueVisibility = 'public' | 'private' | 'unlisted';

/**
 * League status options
 */
export type LeagueStatus = 'active' | 'archived';

/**
 * League interface matching backend LeagueData DTO
 */
export interface League {
  id: number;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  header_image_url: string | null;
  platform_ids: number[];
  platforms?: Platform[];
  discord_url: string | null;
  website_url: string | null;
  twitter_handle: string | null;
  instagram_handle: string | null;
  youtube_url: string | null;
  twitch_url: string | null;
  visibility: LeagueVisibility;
  timezone: string;
  owner_user_id: number;
  contact_email: string;
  organizer_name: string;
  status: LeagueStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Form data interface for the league creation wizard
 */
export interface CreateLeagueForm {
  // Step 1: Essentials
  name: string;
  logo: File | null;
  logo_url?: string | null; // Existing logo URL (for edit mode)
  platform_ids: number[];
  timezone: string;
  visibility: LeagueVisibility;

  // Step 2: Branding & Description
  tagline: string;
  description: string;
  header_image: File | null;
  header_image_url?: string | null; // Existing header image URL (for edit mode)

  // Step 3: Community & Admin
  contact_email: string;
  organizer_name: string;
  discord_url: string;
  website_url: string;
  twitter_handle: string;
  instagram_handle: string;
  youtube_url: string;
  twitch_url: string;
}

/**
 * Slug availability check response
 */
export interface SlugCheckResponse {
  available: boolean;
  slug: string;
  message?: string;
}

/**
 * API error response
 */
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * Update league form data (all fields optional for partial updates)
 */
export interface UpdateLeagueForm {
  // Essentials
  name?: string;
  logo?: File | null;
  logo_url?: string | null; // Existing logo URL (for edit mode)
  platform_ids?: number[];
  timezone?: string;
  visibility?: LeagueVisibility;

  // Branding
  tagline?: string;
  description?: string;
  header_image?: File | null;
  header_image_url?: string | null; // Existing header image URL (for edit mode)

  // Contact & Community
  contact_email?: string;
  organizer_name?: string;
  discord_url?: string;
  website_url?: string;
  twitter_handle?: string;
  instagram_handle?: string;
  youtube_url?: string;
  twitch_url?: string;
}

/**
 * Form validation errors
 */
export interface FormErrors {
  name?: string;
  logo?: string;
  platform_ids?: string;
  timezone?: string;
  visibility?: string;
  tagline?: string;
  description?: string;
  header_image?: string;
  contact_email?: string;
  organizer_name?: string;
  discord_url?: string;
  website_url?: string;
  twitter_handle?: string;
  instagram_handle?: string;
  youtube_url?: string;
  twitch_url?: string;
}
