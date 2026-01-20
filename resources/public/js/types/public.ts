/**
 * Public-facing TypeScript types for the public dashboard
 * These represent the public view of data (subset of admin types)
 */

import type { MediaObject } from './media';

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
  logo_url: string | null; // OLD - deprecated, kept for backward compatibility
  logo?: MediaObject | null; // NEW - responsive media
  header_image_url: string | null; // OLD - deprecated
  header_image?: MediaObject | null; // NEW - responsive media
  banner_url?: string | null; // OLD - deprecated
  banner?: MediaObject | null; // NEW - responsive media
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
  logo_url: string | null; // OLD - deprecated
  logo?: MediaObject | null; // NEW - responsive media
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
  logo_url: string; // OLD - deprecated
  logo?: MediaObject | null; // NEW - responsive media
  banner_url: string | null; // OLD - deprecated
  banner?: MediaObject | null; // NEW - responsive media
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
 * Cross-division aggregate result
 */
export interface CrossDivisionResult {
  position: number;
  driver_id: number;
  driver_name: string;
  driver_number: string;
  division_id?: number;
  division_name?: string;
  time_ms: number;
  time_formatted: string;
  time_difference?: string | null; // "+0.345" format, null for P1
}

/**
 * Time Result (simplified aggregate results for qualifying, fastest laps, race times)
 */
export interface TimeResult {
  position: number;
  driver_id: number;
  driver_name: string;
  division_id?: number;
  division_name?: string;
  time_formatted: string;
  time_difference?: string | null; // "+0.345" format, null for P1
}

/**
 * Round Standing Driver (from round_results)
 */
export interface RoundStandingDriver {
  position: number;
  driver_id: number;
  driver_name: string;
  total_points: number;
  race_points: number;
  fastest_lap_points: number;
  pole_position_points: number;
  total_positions_gained: number;
}

/**
 * Round Standing Division (for seasons with divisions)
 */
export interface RoundStandingDivision {
  division_id: number;
  division_name: string;
  results: RoundStandingDriver[]; // Note: "results" not "standings"
}

/**
 * Round Standings wrapper
 */
export interface RoundStandings {
  standings: RoundStandingDriver[] | RoundStandingDivision[];
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
  circuit_name: string | null;
  circuit_country: string | null;
  track_name: string | null;
  track_layout: string | null;
  status: 'scheduled' | 'pre_race' | 'in_progress' | 'completed' | 'cancelled';
  status_label: string;
  races: PublicRace[];
  qualifying_results?: CrossDivisionResult[];
  race_time_results?: CrossDivisionResult[];
  fastest_lap_results?: CrossDivisionResult[];
  round_standings?: RoundStandings | null;
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
  is_qualifier: boolean;
  race_points: boolean;
}

/**
 * Season Standing Driver
 */
export interface SeasonStandingDriver {
  position: number;
  driver_id: number;
  driver_name: string;
  total_points: number;
  drop_total: number;
  podiums: number;
  poles: number;
  rounds: RoundPoints[];
  team_id?: number | null;
  team_name?: string | null;
  team_logo?: string | null;
}

/**
 * Round Points
 */
export interface RoundPoints {
  round_id: number;
  round_number: number;
  points: number;
  position: number | null;
  has_pole: boolean;
  has_fastest_lap: boolean;
  total_penalties: number;
}

/**
 * Team Round Points
 */
export interface TeamRoundPoints {
  round_id: number;
  round_number: number;
  points: number;
}

/**
 * Team Championship Standing
 */
export interface TeamChampionshipStanding {
  team_id: number;
  team_name: string;
  total_points: number;
  drop_total?: number;
  position: number;
  rounds: TeamRoundPoints[];
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
  logo_url: string | null; // OLD - deprecated
  logo?: MediaObject | null; // NEW - responsive media
  header_image_url: string | null; // OLD - deprecated
  header_image?: MediaObject | null; // NEW - responsive media
  banner_url?: string | null; // OLD - deprecated
  banner?: MediaObject | null; // NEW - responsive media
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
  logo_url: string | null; // OLD - deprecated
  logo?: MediaObject | null; // NEW - responsive media
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
    logo_url?: string | null; // OLD - deprecated
    logo?: MediaObject | null; // NEW - responsive media
    header_image_url?: string | null; // OLD - deprecated
    header_image?: MediaObject | null; // NEW - responsive media
  };
  competition: {
    name: string;
    slug: string;
  };
  season: PublicSeason;
  rounds: PublicRound[];
  standings: SeasonStandingDriver[] | SeasonStandingDivision[];
  has_divisions: boolean;
  team_championship_enabled?: boolean;
  team_championship_results?: TeamChampionshipStanding[];
  teams_drop_rounds_enabled?: boolean;
  drop_round_enabled?: boolean;
  qualifying_results?: PublicRaceResult[] | PublicRaceResultDivision[];
  fastest_lap_results?: PublicRaceResult[] | PublicRaceResultDivision[];
  race_time_results?: PublicRaceResult[] | PublicRaceResultDivision[];
}

/**
 * Public Race Result
 */
export interface PublicRaceResult {
  position: number | null;
  driver_id: number;
  driver_name: string;
  race_time: string | null;
  race_time_difference: string | null;
  fastest_lap: string | null;
  penalties: string | null;
  race_points: number;
  has_fastest_lap: boolean;
  has_pole: boolean;
  dnf: boolean;
  status: string;
  // Optional division fields for cross-division display
  division_id?: number;
  division_name?: string;
}

/**
 * Public Race Results Response (flat or with divisions)
 */
export interface PublicRaceResultsResponse {
  race: {
    id: number;
    race_number: number;
    name: string | null;
    race_type: 'sprint' | 'feature' | 'endurance' | 'qualifying' | 'custom';
    status: string;
    is_qualifier: boolean;
    race_points: boolean;
  };
  has_divisions: boolean;
  results: PublicRaceResult[] | PublicRaceResultDivision[];
}

export interface PublicRaceResultDivision {
  division_id: number;
  division_name: string;
  results: PublicRaceResult[];
}

/**
 * Public Driver Profile
 */
export interface PublicDriverProfile {
  nickname: string;
  driver_number: number | null;
  platform_accounts: {
    psn_id?: string;
    discord_id?: string;
    iracing_id?: string;
  };
  career_stats: {
    total_poles: number;
    total_podiums: number;
  };
  competitions: Array<{
    league_name: string;
    league_slug: string;
    season_name: string;
    season_slug: string;
    status: 'active' | 'reserve' | 'withdrawn';
  }>;
}
