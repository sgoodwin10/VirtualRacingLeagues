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
}

export interface NextRoundNumberResponse {
  next_round_number: number;
}
