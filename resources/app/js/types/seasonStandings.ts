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
  readonly rounds: readonly RoundPoints[];
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
}

/**
 * Season standings response from API - Divisions with nested drivers
 */
export interface SeasonStandingsResponseDivisions {
  readonly standings: readonly SeasonStandingDivision[];
  readonly has_divisions: true;
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
 */
export function isDivisionStandings(
  response: SeasonStandingsResponse,
): response is SeasonStandingsResponseDivisions {
  return response.has_divisions === true;
}
