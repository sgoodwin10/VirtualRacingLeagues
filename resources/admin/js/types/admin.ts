import type { PaginationMeta, PaginationLinks, ApiErrorResponse } from './api';

/**
 * Admin user interface
 */
export interface Admin {
  id: number;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  role: AdminRole;
  status: AdminStatus;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

/**
 * Admin status type
 */
export type AdminStatus = 'active' | 'inactive' | 'suspended';

/**
 * Admin roles type
 */
export type AdminRole = 'super_admin' | 'admin' | 'moderator';

/**
 * Login credentials interface
 */
export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
  recaptcha_token?: string | null;
}

/**
 * Login response interface
 */
export interface LoginResponse {
  success: boolean;
  data: {
    admin: Admin;
  };
  message?: string;
}

/**
 * Auth check response interface
 */
export interface AuthCheckResponse {
  success: boolean;
  data: {
    authenticated: boolean;
    admin?: Admin;
  };
}

/**
 * Logout response interface
 */
export interface LogoutResponse {
  success: boolean;
  message?: string;
}

/**
 * Admin user update data interface
 */
export interface AdminUserUpdateData {
  first_name: string;
  last_name: string;
  email: string;
  role: AdminRole;
}

/**
 * Admin user list response interface
 * Always returns paginated data with meta and links
 */
export interface AdminUserListResponse {
  data: Admin[];
  meta: PaginationMeta;
  links: PaginationLinks;
}

/**
 * Admin user response interface
 */
export interface AdminUserResponse {
  success: boolean;
  data: Admin;
  message?: string;
}

/**
 * Delete admin user response interface
 */
export interface DeleteAdminUserResponse {
  success: boolean;
  message?: string;
}

// Re-export ApiErrorResponse for backward compatibility
export type { ApiErrorResponse };
