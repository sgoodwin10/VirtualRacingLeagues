/**
 * TypeScript types for Season Standings
 * Represents cumulative driver standings across all rounds in a season
 */

/**
 * Points earned by a driver in a specific round
 */
export interface RoundPoints {
  readonly round_id: number;
  readonly round_number: number;
  readonly points: number;
  readonly has_pole: boolean;
  readonly has_fastest_lap: boolean;
}

/**
 * Driver standing in season results (cumulative across all rounds)
 */
export interface SeasonStandingDriver {
  readonly position: number;
  readonly driver_id: number;
  readonly driver_name: string;
  readonly total_points: number;
  readonly drop_total: number;
  readonly podiums: number;
  readonly rounds: readonly RoundPoints[];
  readonly team_id: number | null;
  readonly team_name: string | null;
  readonly team_logo: string | null;
}

/**
 * Points earned by a team in a specific round
 */
export interface TeamRoundPoints {
  readonly round_id: number;
  readonly round_number: number;
  readonly points: number;
}

/**
 * Team standing in championship (cumulative team points)
 */
export interface TeamChampionshipStanding {
  readonly team_id: number;
  readonly team_name: string;
  readonly total_points: number;
  readonly drop_total?: number;
  readonly position: number;
  readonly rounds: readonly TeamRoundPoints[];
}

/**
 * Division standing (when divisions enabled)
 * Contains all drivers in a specific division
 */
export interface SeasonStandingDivision {
  readonly division_id: number;
  readonly division_name: string;
  readonly order: number;
  readonly drivers: readonly SeasonStandingDriver[];
}

/**
 * Season standings response from API - Flat driver list (no divisions)
 */
export interface SeasonStandingsResponseFlat {
  readonly standings: readonly SeasonStandingDriver[];
  readonly has_divisions: false;
  readonly drop_round_enabled: boolean;
  readonly total_drop_rounds: number;
  readonly team_championship_enabled: boolean;
  readonly team_championship_results: readonly TeamChampionshipStanding[];
  readonly teams_drop_rounds_enabled: boolean;
  readonly teams_total_drop_rounds: number;
}

/**
 * Season standings response from API - Divisions with nested drivers
 */
export interface SeasonStandingsResponseDivisions {
  readonly standings: readonly SeasonStandingDivision[];
  readonly has_divisions: true;
  readonly drop_round_enabled: boolean;
  readonly total_drop_rounds: number;
  readonly team_championship_enabled: boolean;
  readonly team_championship_results: readonly TeamChampionshipStanding[];
  readonly teams_drop_rounds_enabled: boolean;
  readonly teams_total_drop_rounds: number;
}

/**
 * Season standings response from API (discriminated union)
 * Contains either a flat list of drivers or divisions with nested drivers
 */
export type SeasonStandingsResponse =
  | SeasonStandingsResponseFlat
  | SeasonStandingsResponseDivisions;

/**
 * Type guard to check if standings response contains divisions
 *
 * Note: This guard only checks the `has_divisions` boolean discriminator.
 * It assumes the backend returns the correct structure based on this flag.
 * The type system enforces that:
 * - When has_divisions is true, standings contains SeasonStandingDivision[]
 * - When has_divisions is false, standings contains SeasonStandingDriver[]
 *
 * @param response - The season standings response to check
 * @returns true if response contains divisions, false if it contains a flat driver list
 */
export function isDivisionStandings(
  response: SeasonStandingsResponse,
): response is SeasonStandingsResponseDivisions {
  return response.has_divisions === true;
}
