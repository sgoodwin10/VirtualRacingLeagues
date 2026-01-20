import type { ApiResponse, PaginatedResponse } from './api';

/**
 * Contact Submission Type
 */
export interface Contact {
  id: number;
  name: string;
  email: string;
  reason: ContactReason;
  message: string;
  source: ContactSource;
  status: ContactStatus;
  cc_user: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/**
 * Contact Reason Types
 */
export type ContactReason = 'error' | 'question' | 'help' | 'other';

/**
 * Contact Source
 */
export type ContactSource = 'app' | 'public';

/**
 * Contact Status
 */
export type ContactStatus = 'new' | 'read' | 'responded' | 'archived';

/**
 * Contact Filter Parameters
 */
export interface ContactFilterParams {
  page?: number;
  per_page?: number;
  status?: ContactStatus | null;
  source?: ContactSource | null;
  date_from?: string | null;
  date_to?: string | null;
  search?: string | null;
}

/**
 * Contact List Response
 */
export type ContactListResponse = ApiResponse<PaginatedResponse<Contact>>;

/**
 * Contact Detail Response
 */
export type ContactDetailResponse = ApiResponse<Contact>;

/**
 * Contact Update Response
 */
export type ContactUpdateResponse = ApiResponse<Contact>;

/**
 * Contact Option Types for Dropdown
 */
export interface ContactReasonOption {
  label: string;
  value: ContactReason;
}

export interface ContactSourceOption {
  label: string;
  value: ContactSource;
}

export interface ContactStatusOption {
  label: string;
  value: ContactStatus;
}
