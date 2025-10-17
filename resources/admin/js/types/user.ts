export interface User {
  id: string;
  first_name: string;
  last_name: string;
  name?: string; // Computed field - optional for backward compatibility
  email: string;
  email_verified_at: string | null;
  alias: string | null;
  uuid: string | null;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  activities?: Activity[];
}

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface Activity {
  id: number;
  log_name: string;
  description: string;
  subject_type: string;
  subject_id: string;
  causer_type: string | null;
  causer_id: string | null;
  properties: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  alias?: string | null;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface UpdateUserPayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  alias?: string | null;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface UserListParams {
  search?: string;
  status?: 'active' | 'inactive' | 'suspended';
  include_deleted?: boolean;
  sort_field?: string;
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface UserListResponse {
  users: User[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

/**
 * Generic API Response wrapper
 * Backend wraps all responses with { success: true, data: ... }
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}
