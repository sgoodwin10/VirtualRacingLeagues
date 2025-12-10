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
    total_rounds: number;
    completed_rounds: number;
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
  podiums: number;
  poles: number;
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
 * Helper to parse RGB color string with runtime validation
 */
export function parseRGBColor(colorString: string | null): RGBColor | null {
  if (!colorString) return null;
  try {
    const parsed = JSON.parse(colorString);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.r === 'number' &&
      typeof parsed.g === 'number' &&
      typeof parsed.b === 'number'
    ) {
      return parsed as RGBColor;
    }
    return null;
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

/**
 * League Detail API Response Types
 */

/**
 * Response from GET /api/public/leagues/{slug}
 */
export interface PublicLeagueDetailResponse {
  league: PublicLeagueInfo;
  stats: LeagueStats;
  competitions: PublicCompetitionDetail[];
  recent_activity: RecentActivity[];
  upcoming_races: UpcomingRace[];
  championship_leaders: ChampionshipLeader[];
}

export interface PublicLeagueInfo {
  id: number;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  header_image_url: string | null;
  platforms: Platform[];
  visibility: 'public' | 'unlisted';
  discord_url: string | null;
  website_url: string | null;
  twitter_handle: string | null;
  youtube_url: string | null;
  twitch_url: string | null;
  created_at: string;
}

export interface LeagueStats {
  competitions_count: number;
  active_seasons_count: number;
  drivers_count: number;
}

export interface PublicCompetitionDetail {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  competition_colour: string | null;
  platform: Platform;
  stats: {
    total_seasons: number;
    active_seasons: number;
    total_drivers: number;
  };
  seasons: PublicSeasonSummary[];
}

export interface PublicSeasonSummary {
  id: number;
  name: string;
  slug: string;
  car_class: string | null;
  status: 'setup' | 'active' | 'completed' | 'archived';
  stats: {
    total_drivers: number;
    active_drivers: number;
    total_rounds: number;
    completed_rounds: number;
  };
}

// Sidebar types (for future use - will be empty arrays for now)
export interface RecentActivity {
  type: 'race_completed' | 'driver_joined' | 'season_started' | 'championship_leader';
  title: string;
  subtitle: string;
  timestamp: string;
  icon_type: 'success' | 'info' | 'warning' | 'gold' | 'purple';
}

export interface UpcomingRace {
  id: number;
  track_name: string;
  season_name: string;
  competition_name: string;
  scheduled_at: string;
  drivers_registered: number;
  is_next: boolean;
}

export interface ChampionshipLeader {
  position: number;
  driver_name: string;
  season_name: string;
  points: number;
}

/**
 * Response from GET /api/public/leagues/{slug}/seasons/{seasonSlug}
 */
export interface PublicSeasonDetailResponse {
  league: {
    name: string;
    slug: string;
    logo_url?: string | null;
    header_image_url?: string | null;
  };
  competition: {
    name: string;
    slug: string;
  };
  season: PublicSeason;
  rounds: PublicRound[];
  standings: SeasonStandingDriver[] | SeasonStandingDivision[];
  has_divisions: boolean;
}
