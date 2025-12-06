// Race Result status
export type RaceResultStatus = 'pending' | 'confirmed';

// Single race result entry
export interface RaceResult {
  id: number;
  race_id: number;
  driver_id: number;
  division_id?: number | null;
  position: number | null;
  original_race_time: string | null; // hh:mm:ss.ms format (driver's actual time)
  final_race_time: string | null; // hh:mm:ss.ms format (original + penalties, calculated by backend)
  original_race_time_difference: string | null; // Gap to leader before penalties
  final_race_time_difference: string | null; // Gap to leader after penalties (calculated by backend)
  fastest_lap: string | null;
  penalties: string | null;
  has_fastest_lap: boolean;
  has_pole: boolean;
  dnf: boolean;
  status: RaceResultStatus;
  race_points: number;
  positions_gained: number | null; // Positive = gained positions, negative = lost positions, null = no grid source
  created_at: string;
  updated_at: string;
  // Eager loaded
  driver?: {
    id: number;
    name: string;
    division_id?: number;
  };
}

// Form data for a single result row (used in the UI before saving)
export interface RaceResultFormData {
  driver_id: number | null;
  division_id?: number | null;
  position: number | null;
  original_race_time: string;
  final_race_time?: string; // Calculated by backend (original + penalties), used for read-only display
  original_race_time_difference: string; // User-entered gap to leader (before penalties)
  final_race_time_difference?: string; // Calculated by backend (gap after penalties), used for read-only display
  fastest_lap: string;
  penalties: string;
  has_fastest_lap: boolean;
  has_pole: boolean;
  dnf: boolean;
  // Transient fields (not sent to backend, used for UI state tracking)
  _originalPenalties?: string; // Tracks original penalty value when loaded
  _penaltyChanged?: boolean; // Tracks if penalty was modified this session
  calculated_time_diff?: string | null; // Frontend-calculated time difference for read-only display
}

// Create/update payload for a single result
export interface CreateRaceResultPayload {
  driver_id: number;
  division_id?: number | null;
  position?: number | null;
  original_race_time?: string | null;
  original_race_time_difference?: string | null;
  fastest_lap?: string | null;
  penalties?: string | null;
  has_fastest_lap?: boolean;
  has_pole?: boolean;
  dnf?: boolean;
}

// Bulk save payload
export interface BulkRaceResultsPayload {
  results: CreateRaceResultPayload[];
}

// CSV parsed row
export interface CsvResultRow {
  driver: string;
  race_time?: string; // Maps to original_race_time
  original_race_time?: string; // Alternative column name
  original_race_time_difference?: string;
  fastest_lap_time?: string;
  penalties?: string;
  dnf?: boolean;
}

// Driver option for select dropdown
export interface DriverOption {
  id: number;
  name: string;
  division_id?: number;
  disabled?: boolean; // True if already selected in another row
  nickname?: string | null;
  psn_id?: string | null;
  iracing_id?: string | null;
  discord_id?: string | null;
}

// Time in milliseconds (for calculations)
export interface TimeMs {
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  totalMs: number;
}
