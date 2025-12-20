import type { RaceResult } from './raceResult';

/**
 * Driver standing in round results
 */
export interface RoundStandingDriver {
  position: number;
  driver_id: number;
  driver_name: string;
  /** Final points: Sum of race_points + fastest_lap_points + pole_position_points (does NOT include round points) */
  total_points: number;
  /** Sum of position-based points from all races in the round */
  race_points: number;
  /** Bonus points for fastest lap(s) */
  fastest_lap_points: number;
  /** Bonus points for pole position(s) */
  pole_position_points: number;
  /** Total positions gained/lost across all races */
  total_positions_gained: number;
}

/**
 * Division standing (when divisions enabled)
 */
export interface RoundStandingDivision {
  division_id: number;
  division_name: string;
  results: RoundStandingDriver[];
}

/**
 * The round_results structure
 */
export interface RoundStandings {
  standings: RoundStandingDriver[] | RoundStandingDivision[];
}

/**
 * Cross-division result entry
 * Used for qualifying times, race times, and fastest laps across all divisions
 */
export interface CrossDivisionResult {
  position: number;
  race_result_id: number;
  time_ms: number;
}

/**
 * Round results response from API
 * Contains all race events and their results for a specific round
 */
export interface RoundResultsResponse {
  round: {
    id: number;
    round_number: number;
    name: string | null;
    status: string;
    round_results: RoundStandings | null;
    qualifying_results: CrossDivisionResult[] | null;
    race_time_results: CrossDivisionResult[] | null;
    fastest_lap_results: CrossDivisionResult[] | null;
  };
  divisions: Array<{
    id: number;
    name: string;
  }>;
  race_events: RaceEventResults[];
  // Indicates if this round has orphaned results (results with NULL division_id when divisions are enabled)
  has_orphaned_results?: boolean;
}

/**
 * Race event with its results
 * Represents a single race or qualifier within a round
 */
export interface RaceEventResults {
  id: number;
  race_number: number;
  name: string | null;
  is_qualifier: boolean;
  race_points: boolean;
  status: string;
  results: RaceResultWithDriver[];
}

/**
 * Race result with driver information
 * Backend returns driver as nested object with id and name
 */
export interface RaceResultWithDriver extends RaceResult {
  driver: {
    id: number;
    name: string;
  };
}
