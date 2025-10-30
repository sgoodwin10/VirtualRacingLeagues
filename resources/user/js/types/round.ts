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
  status: RoundStatus;
  status_label: string;
  created_by_user_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type RoundStatus = 'scheduled' | 'pre_race' | 'in_progress' | 'completed' | 'cancelled';

export interface CreateRoundRequest {
  round_number: number;
  name?: string;
  scheduled_at?: string | null; // 'YYYY-MM-DD HH:mm:ss'
  platform_track_id?: number | null;
  track_layout?: string;
  track_conditions?: string;
  technical_notes?: string;
  stream_url?: string;
  internal_notes?: string;
}

export interface UpdateRoundRequest {
  round_number?: number;
  name?: string;
  scheduled_at?: string | null;
  platform_track_id?: number | null;
  track_layout?: string;
  track_conditions?: string;
  technical_notes?: string;
  stream_url?: string;
  internal_notes?: string;
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
}

export interface NextRoundNumberResponse {
  next_round_number: number;
}
