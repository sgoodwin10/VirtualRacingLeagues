/**
 * Site Config File Type
 */
export type SiteConfigFileType = 'logo' | 'favicon' | 'og_image';

/**
 * Site Config File Interface
 */
export interface SiteConfigFile {
  id: number;
  url: string;
  file_name: string;
  mime_type: string;
  file_size: number;
}

/**
 * Site Config Interface
 */
export interface SiteConfig {
  id: number;
  site_name: string;
  google_tag_manager_id: string | null;
  google_analytics_id: string | null;
  google_search_console_code: string | null;
  discord_link: string | null;
  support_email: string | null;
  contact_email: string | null;
  admin_email: string | null;
  maintenance_mode: boolean;
  timezone: string;
  user_registration_enabled: boolean;
  files: {
    logo: SiteConfigFile | null;
    favicon: SiteConfigFile | null;
    og_image: SiteConfigFile | null;
  };
  created_at: string;
  updated_at: string;
}

/**
 * Update Site Config Request Data
 */
export interface UpdateSiteConfigRequest {
  site_name: string;
  google_tag_manager_id?: string | null;
  google_analytics_id?: string | null;
  google_search_console_code?: string | null;
  discord_link?: string | null;
  support_email?: string | null;
  contact_email?: string | null;
  admin_email?: string | null;
  maintenance_mode: boolean;
  timezone: string;
  user_registration_enabled: boolean;
  logo?: File | null;
  favicon?: File | null;
  og_image?: File | null;
  remove_logo?: boolean;
  remove_favicon?: boolean;
  remove_og_image?: boolean;
}

/**
 * Site Config API Response
 */
export interface SiteConfigResponse {
  success: boolean;
  data: SiteConfig;
  message?: string;
}

/**
 * Validation error structure
 */
export interface ValidationErrors {
  [key: string]: string[];
}

/**
 * File validation rules
 */
export const FILE_VALIDATION = {
  logo: {
    maxSize: 2048, // KB
    acceptedTypes: ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml'],
    extensions: ['.png', '.jpg', '.jpeg', '.svg'],
  },
  favicon: {
    maxSize: 512, // KB
    acceptedTypes: ['image/x-icon', 'image/png'],
    extensions: ['.ico', '.png'],
  },
  og_image: {
    maxSize: 2048, // KB
    acceptedTypes: ['image/png', 'image/jpg', 'image/jpeg'],
    extensions: ['.png', '.jpg', '.jpeg'],
  },
} as const;

/**
 * Timezone option
 */
export interface TimezoneOption {
  label: string;
  value: string;
}

/**
 * Common timezones list
 */
export const COMMON_TIMEZONES: TimezoneOption[] = [
  { label: 'UTC', value: 'UTC' },
  { label: 'America/New_York (EST)', value: 'America/New_York' },
  { label: 'America/Chicago (CST)', value: 'America/Chicago' },
  { label: 'America/Denver (MST)', value: 'America/Denver' },
  { label: 'America/Los_Angeles (PST)', value: 'America/Los_Angeles' },
  { label: 'America/Phoenix (Arizona)', value: 'America/Phoenix' },
  { label: 'America/Anchorage (Alaska)', value: 'America/Anchorage' },
  { label: 'Pacific/Honolulu (Hawaii)', value: 'Pacific/Honolulu' },
  { label: 'Europe/London (GMT)', value: 'Europe/London' },
  { label: 'Europe/Paris (CET)', value: 'Europe/Paris' },
  { label: 'Europe/Berlin (CET)', value: 'Europe/Berlin' },
  { label: 'Europe/Madrid (CET)', value: 'Europe/Madrid' },
  { label: 'Europe/Rome (CET)', value: 'Europe/Rome' },
  { label: 'Europe/Amsterdam (CET)', value: 'Europe/Amsterdam' },
  { label: 'Asia/Tokyo (JST)', value: 'Asia/Tokyo' },
  { label: 'Asia/Shanghai (CST)', value: 'Asia/Shanghai' },
  { label: 'Asia/Hong_Kong (HKT)', value: 'Asia/Hong_Kong' },
  { label: 'Asia/Singapore (SGT)', value: 'Asia/Singapore' },
  { label: 'Asia/Dubai (GST)', value: 'Asia/Dubai' },
  { label: 'Australia/Sydney (AEST)', value: 'Australia/Sydney' },
  { label: 'Australia/Melbourne (AEST)', value: 'Australia/Melbourne' },
  { label: 'Australia/Brisbane (AEST)', value: 'Australia/Brisbane' },
  { label: 'Australia/Perth (AWST)', value: 'Australia/Perth' },
  { label: 'Pacific/Auckland (NZST)', value: 'Pacific/Auckland' },
];
