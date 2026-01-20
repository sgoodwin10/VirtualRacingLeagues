import type { ApiResponse, PaginatedResponse } from './api';

/**
 * Notification Log Type
 */
export interface NotificationLog {
  id: number;
  notification_type: NotificationType;
  channel: NotificationChannel;
  recipient: string;
  subject: string | null;
  body: string;
  status: NotificationStatus;
  error_message: string | null;
  sent_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/**
 * Notification Types
 */
export type NotificationType =
  | 'contact'
  | 'registration'
  | 'email_verification'
  | 'password_reset'
  | 'system';

/**
 * Notification Channels
 */
export type NotificationChannel = 'email' | 'discord';

/**
 * Notification Status
 */
export type NotificationStatus = 'pending' | 'sent' | 'failed';

/**
 * Notification Filter Parameters
 */
export interface NotificationFilterParams {
  page?: number;
  per_page?: number;
  type?: NotificationType | null;
  channel?: NotificationChannel | null;
  status?: NotificationStatus | null;
  date_from?: string | null;
  date_to?: string | null;
}

/**
 * Notification List Response
 */
export type NotificationListResponse = ApiResponse<PaginatedResponse<NotificationLog>>;

/**
 * Notification Detail Response
 */
export type NotificationDetailResponse = ApiResponse<NotificationLog>;

/**
 * Notification Option Types for Dropdown
 */
export interface NotificationTypeOption {
  label: string;
  value: NotificationType;
}

export interface NotificationChannelOption {
  label: string;
  value: NotificationChannel;
}

export interface NotificationStatusOption {
  label: string;
  value: NotificationStatus;
}
