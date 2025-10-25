// Main entity (matches backend RaceData DTO)
export interface Race {
  id: number;
  round_id: number;
  race_number: number;
  name: string | null;
  race_type: RaceType | null;
  qualifying_format: QualifyingFormat;
  qualifying_length: number | null;
  qualifying_tire: string | null;
  grid_source: GridSource;
  grid_source_race_id: number | null;
  length_type: RaceLengthType;
  length_value: number;
  extra_lap_after_time: boolean;
  weather: string | null;
  tire_restrictions: string | null;
  fuel_usage: string | null;
  damage_model: string | null;
  track_limits_enforced: boolean;
  false_start_detection: boolean;
  collision_penalties: boolean;
  mandatory_pit_stop: boolean;
  minimum_pit_time: number | null;
  assists_restrictions: string | null;
  race_divisions: boolean;
  points_system: PointsSystemMap;
  bonus_points: BonusPoints | null;
  dnf_points: number;
  dns_points: number;
  race_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type RaceType = 'sprint' | 'feature' | 'endurance' | 'qualifying' | 'custom';
export type QualifyingFormat = 'standard' | 'time_trial' | 'none' | 'previous_race';
export type GridSource =
  | 'qualifying'
  | 'previous_race'
  | 'reverse_previous'
  | 'championship'
  | 'reverse_championship'
  | 'manual';
export type RaceLengthType = 'laps' | 'time';

export interface PointsSystemMap {
  [position: number]: number; // 1: 25, 2: 18, etc.
}

export interface BonusPoints {
  pole?: number;
  fastest_lap?: number;
  fastest_lap_top_10_only?: boolean;
  most_positions_gained?: number;
  leading_most_laps?: number;
}

// Create payload
export interface CreateRaceRequest {
  race_number: number;
  name?: string;
  race_type?: RaceType;
  qualifying_format: QualifyingFormat;
  qualifying_length?: number;
  qualifying_tire?: string;
  grid_source: GridSource;
  grid_source_race_id?: number;
  length_type: RaceLengthType;
  length_value: number;
  extra_lap_after_time: boolean;
  weather?: string;
  tire_restrictions?: string;
  fuel_usage?: string;
  damage_model?: string;
  track_limits_enforced: boolean;
  false_start_detection: boolean;
  collision_penalties: boolean;
  mandatory_pit_stop: boolean;
  minimum_pit_time?: number;
  assists_restrictions?: string;
  race_divisions: boolean;
  points_system: PointsSystemMap;
  bonus_points?: BonusPoints;
  dnf_points: number;
  dns_points: number;
  race_notes?: string;
}

// Update payload
export type UpdateRaceRequest = Partial<CreateRaceRequest>;

// Form state
export interface RaceForm {
  race_number: number;
  name: string;
  race_type: RaceType | null;
  qualifying_format: QualifyingFormat;
  qualifying_length: number;
  qualifying_tire: string;
  grid_source: GridSource;
  grid_source_race_id: number | null;
  length_type: RaceLengthType;
  length_value: number;
  extra_lap_after_time: boolean;
  weather: string;
  tire_restrictions: string;
  fuel_usage: string;
  damage_model: string;
  track_limits_enforced: boolean;
  false_start_detection: boolean;
  collision_penalties: boolean;
  mandatory_pit_stop: boolean;
  minimum_pit_time: number;
  assists_restrictions: string;
  race_divisions: boolean;
  points_template: 'f1' | 'custom';
  points_system: PointsSystemMap;
  bonus_pole: boolean;
  bonus_pole_points: number;
  bonus_fastest_lap: boolean;
  bonus_fastest_lap_points: number;
  bonus_fastest_lap_top_10: boolean;
  dnf_points: number;
  dns_points: number;
  race_notes: string;
}

// Form errors
export interface RaceFormErrors {
  race_number?: string;
  name?: string;
  qualifying_length?: string;
  length_value?: string;
  minimum_pit_time?: string;
  points_system?: string;
}

// Platform settings configuration
export interface PlatformSettingOption {
  value: string;
  label: string;
}

export interface PlatformRaceSettings {
  weather_conditions: PlatformSettingOption[];
  tire_restrictions: PlatformSettingOption[];
  fuel_usage: PlatformSettingOption[];
  damage_model: PlatformSettingOption[];
  assists_restrictions: PlatformSettingOption[];
}

// Dropdown options for race types
export const RACE_TYPE_OPTIONS: { value: RaceType; label: string }[] = [
  { value: 'sprint', label: 'Sprint' },
  { value: 'feature', label: 'Feature' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'qualifying', label: 'Qualifying' },
  { value: 'custom', label: 'Custom' },
];

// Dropdown options for qualifying formats
export const QUALIFYING_FORMAT_OPTIONS: { value: QualifyingFormat; label: string }[] = [
  { value: 'standard', label: 'Standard Qualifying' },
  { value: 'time_trial', label: 'Time Trial' },
  { value: 'none', label: 'No Qualifying' },
  { value: 'previous_race', label: 'Previous Race Result' },
];

// Dropdown options for grid sources
export const GRID_SOURCE_OPTIONS: { value: GridSource; label: string }[] = [
  { value: 'qualifying', label: 'Qualifying Result' },
  { value: 'previous_race', label: 'Previous Race Result' },
  { value: 'reverse_previous', label: 'Reverse Previous Race' },
  { value: 'championship', label: 'Championship Standings' },
  { value: 'reverse_championship', label: 'Reverse Championship' },
  { value: 'manual', label: 'Manual Grid' },
];

// Dropdown options for race length types
export const RACE_LENGTH_TYPE_OPTIONS: { value: RaceLengthType; label: string }[] = [
  { value: 'laps', label: 'Laps' },
  { value: 'time', label: 'Time (minutes)' },
];

// F1 Standard Points System
export const F1_STANDARD_POINTS: PointsSystemMap = {
  1: 25,
  2: 18,
  3: 15,
  4: 12,
  5: 10,
  6: 8,
  7: 6,
  8: 4,
  9: 2,
  10: 1,
};

/**
 * Check if a race is a qualifier
 * Qualifiers have race_number === 0 and race_type === 'qualifying'
 */
export function isQualifier(race: Race): boolean {
  return race.race_number === 0 && race.race_type === 'qualifying';
}
