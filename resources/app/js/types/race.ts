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
  race_points: boolean;
  points_system: PointsSystemMap;
  fastest_lap: number | null;
  fastest_lap_top_10: boolean;
  qualifying_pole: number | null;
  qualifying_pole_top_10: boolean;
  dnf_points: number;
  dns_points: number;
  race_notes: string | null;
  is_qualifier: boolean;
  status: 'scheduled' | 'completed';
  // Orphaned results indicator (only populated for completed races with divisions enabled)
  has_orphaned_results?: boolean;
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

// Create payload (form input type - user may not provide)
// Note: For qualifiers (race_number === 0):
// - race_number is set to 0 to signal qualifier
// - race_type should be omitted (backend will set to 'qualifying')
// - length_type and length_value are automatically set to 'time' and qualifying_length
// - grid_source is always 'qualifying'
// - penalty fields (track_limits_enforced, etc.) should be omitted - backend will set defaults
// - mandatory_pit_stop should be omitted - backend will set to false
export interface CreateRaceRequest {
  race_number?: number; // 0 for qualifiers (explicit), omitted for races (auto-generated)
  name?: string | null;
  race_type?: RaceType | null; // Omit for qualifiers, required for races
  qualifying_format?: QualifyingFormat | null;
  qualifying_length?: number | null; // Required when qualifying_format is 'standard' or 'time_trial'
  qualifying_tire?: string | null;
  grid_source: GridSource; // 'qualifying' for qualifiers
  grid_source_race_id?: number | null; // Required when grid_source is 'previous_race' or 'reverse_previous'
  length_type: RaceLengthType; // For qualifiers: 'time' (uses qualifying_length)
  length_value: number; // For qualifiers: same as qualifying_length
  extra_lap_after_time: boolean; // Always false for qualifiers
  weather?: string | null;
  tire_restrictions?: string | null;
  fuel_usage?: string | null;
  damage_model?: string | null;
  track_limits_enforced?: boolean; // Omit for qualifiers
  false_start_detection?: boolean; // Omit for qualifiers
  collision_penalties?: boolean; // Omit for qualifiers
  mandatory_pit_stop?: boolean; // Omit for qualifiers
  minimum_pit_time?: number | null; // Only for races when mandatory_pit_stop is true
  assists_restrictions?: string | null;
  race_points: boolean;
  points_system: PointsSystemMap;
  fastest_lap?: number | null;
  fastest_lap_top_10?: boolean;
  qualifying_pole?: number | null;
  qualifying_pole_top_10?: boolean;
  dnf_points: number;
  dns_points: number;
  race_notes?: string | null;
}

// Update payload
export interface UpdateRaceRequest extends Partial<CreateRaceRequest> {
  status?: 'scheduled' | 'completed';
}

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
  race_points: boolean;
  points_system: PointsSystemMap;
  fastest_lap: number | null;
  fastest_lap_top_10: boolean;
  qualifying_pole: number | null;
  qualifying_pole_top_10: boolean;
  dnf_points: number;
  dns_points: number;
  race_notes: string;
}

// Form errors
export interface RaceFormErrors {
  race_type?: string;
  race_number?: string;
  name?: string;
  qualifying_length?: string;
  length_value?: string;
  minimum_pit_time?: string;
  points_system?: string;
  grid_source_race_id?: string;
}

// Orphaned results response
export interface OrphanedResultsResponse {
  drivers: Array<{ id: number; name: string }>;
  count: number;
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
  { value: 'standard', label: 'Standard' },
  { value: 'time_trial', label: 'Time Trial' },
];

// Dropdown options for grid sources
export const GRID_SOURCE_OPTIONS: { value: GridSource; label: string }[] = [
  { value: 'qualifying', label: 'Qualifying' },
  { value: 'previous_race', label: 'Previous Race' },
  { value: 'reverse_previous', label: 'Reverse Previous Race' },
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
 * Uses the explicit is_qualifier field from the backend
 */
export function isQualifier(race: Race): boolean {
  return race.is_qualifier;
}
