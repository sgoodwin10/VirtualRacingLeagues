// Main entity (matches backend RoundData DTO)
export interface Round {
  id: number;
  season_id: number;
  round_number: number;
  name: string | null;
  slug: string;
  scheduled_at: string | null; // ISO 8601
  timezone: string;
  platform_track_id: number | null;
  track_layout: string | null;
  track_conditions: string | null;
  technical_notes: string | null;
  stream_url: string | null;
  internal_notes: string | null;
  fastest_lap: number | null;
  fastest_lap_top_10: boolean;
  qualifying_pole: number | null;
  qualifying_pole_top_10: boolean;
  points_system: string | null;
  round_points: boolean;
  status: RoundStatus;
  status_label: string;
  created_by_user_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type RoundStatus = 'scheduled' | 'pre_race' | 'in_progress' | 'completed' | 'cancelled';

// Create request (form input type - user may not provide)
export interface CreateRoundRequest {
  round_number: number;
  name?: string;
  scheduled_at?: string; // 'YYYY-MM-DD HH:mm:ss'
  platform_track_id?: number;
  track_layout?: string;
  track_conditions?: string;
  technical_notes?: string;
  stream_url?: string;
  internal_notes?: string;
  fastest_lap?: number;
  fastest_lap_top_10?: boolean;
  qualifying_pole?: number;
  qualifying_pole_top_10?: boolean;
  points_system?: string;
  round_points?: boolean;
}

// Update request (update/partial type - can be omitted, provided, or cleared)
export interface UpdateRoundRequest {
  round_number?: number;
  name?: string | null;
  scheduled_at?: string | null;
  platform_track_id?: number | null;
  track_layout?: string | null;
  track_conditions?: string | null;
  technical_notes?: string | null;
  stream_url?: string | null;
  internal_notes?: string | null;
  fastest_lap?: number | null;
  fastest_lap_top_10?: boolean;
  qualifying_pole?: number | null;
  qualifying_pole_top_10?: boolean;
  points_system?: string | null;
  round_points?: boolean;
}

export interface PointsSystemMap {
  [position: number]: number; // 1: 25, 2: 18, etc.
}

export interface RoundForm {
  round_number: number;
  name: string;
  scheduled_at: Date | null;
  platform_track_id: number | null;
  track_layout: string;
  track_conditions: string;
  technical_notes: string;
  stream_url: string;
  internal_notes: string;
  fastest_lap: number | null;
  fastest_lap_top_10: boolean;
  qualifying_pole: number | null;
  qualifying_pole_top_10: boolean;
  points_system: PointsSystemMap;
  round_points: boolean;
}

export interface RoundFormErrors {
  round_number?: string;
  name?: string;
  scheduled_at?: string;
  platform_track_id?: string;
  track_layout?: string;
  track_conditions?: string;
  technical_notes?: string;
  stream_url?: string;
  internal_notes?: string;
  fastest_lap?: string;
  fastest_lap_top_10?: string;
  qualifying_pole?: string;
  qualifying_pole_top_10?: string;
  points_system?: string;
  round_points?: string;
}

export interface NextRoundNumberResponse {
  next_round_number: number;
}
