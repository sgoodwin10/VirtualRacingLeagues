/**
 * Public-facing TypeScript types for the public dashboard
 * These represent the public view of data (subset of admin types)
 */

/**
 * Platform reference
 */
export interface Platform {
  id: number;
  name: string;
  slug: string;
}

/**
 * Public League (subset of full League)
 */
export interface PublicLeague {
  id: number;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  header_image_url: string | null;
  platforms: Platform[];
  discord_url: string | null;
  website_url: string | null;
  twitter_handle: string | null;
  instagram_handle: string | null;
  youtube_url: string | null;
  twitch_url: string | null;
  visibility: 'public' | 'unlisted';
  competitions_count: number;
  drivers_count: number;
}

/**
 * Public Competition (subset of full Competition)
 */
export interface PublicCompetition {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  platform_id: number;
  platform_name: string;
  platform_slug: string;
  logo_url: string | null;
  competition_colour: string | null; // RGB JSON string
  stats: {
    total_seasons: number;
    active_seasons: number;
    total_drivers: number;
  };
  seasons: PublicSeason[];
}

/**
 * Public Season (subset of full Season)
 */
export interface PublicSeason {
  id: number;
  name: string;
  slug: string;
  car_class: string | null;
  description: string | null;
  logo_url: string;
  banner_url: string | null;
  status: 'setup' | 'active' | 'completed' | 'archived';
  is_active: boolean;
  is_completed: boolean;
  race_divisions_enabled: boolean;
  stats: {
    total_drivers: number;
    active_drivers: number;
    total_races: number;
    completed_races: number;
  };
}

/**
 * Public Round
 */
export interface PublicRound {
  id: number;
  round_number: number;
  name: string | null;
  slug: string;
  scheduled_at: string | null;
  track_name: string | null;
  track_layout: string | null;
  status: 'scheduled' | 'pre_race' | 'in_progress' | 'completed' | 'cancelled';
  status_label: string;
  races: PublicRace[];
}

/**
 * Public Race
 */
export interface PublicRace {
  id: number;
  race_number: number;
  name: string | null;
  race_type: 'sprint' | 'feature' | 'endurance' | 'qualifying' | 'custom';
  status: string;
}

/**
 * Season Standing Driver
 */
export interface SeasonStandingDriver {
  position: number;
  driver_id: number;
  driver_name: string;
  total_points: number;
  rounds: RoundPoints[];
}

/**
 * Round Points
 */
export interface RoundPoints {
  round_id: number;
  round_number: number;
  points: number;
  has_pole: boolean;
  has_fastest_lap: boolean;
}

/**
 * Division Standing
 */
export interface SeasonStandingDivision {
  division_id: number;
  division_name: string;
  order: number;
  drivers: SeasonStandingDriver[];
}

/**
 * RGB Color interface for parsing competition_colour
 */
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Helper to parse RGB color string
 */
export function parseRGBColor(colorString: string | null): RGBColor | null {
  if (!colorString) return null;
  try {
    return JSON.parse(colorString) as RGBColor;
  } catch {
    return null;
  }
}

/**
 * Helper to convert RGB to CSS color
 */
export function rgbToCss(color: RGBColor | null): string {
  if (!color) return 'transparent';
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}
