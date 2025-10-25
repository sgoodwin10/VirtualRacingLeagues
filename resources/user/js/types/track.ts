export interface Track {
  id: number;
  platform_id: number;
  platform_track_location_id: number;
  name: string;
  slug: string;
  is_reverse: boolean;
  image_path: string | null;
  length_meters: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  location?: TrackLocation;
}

export interface TrackLocation {
  id: number;
  name: string;
  slug: string;
  country: string;
  is_active: boolean;
  sort_order: number;
}

export interface TrackLocationGroup {
  id: number;
  name: string;
  slug: string;
  country: string;
  is_active: boolean;
  sort_order: number;
  tracks: Track[];
}

export interface TrackSearchParams {
  platform_id: number;
  search?: string;
  is_active?: boolean;
}
