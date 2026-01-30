/**
 * External Links Configuration
 *
 * Centralized configuration for external links used throughout the admin dashboard.
 */

/**
 * Sentry.io monitoring URL
 * Update this URL to match your Sentry project
 */
export const SENTRY_URL = import.meta.env.VITE_SENTRY_WEB_URL || 'https://simgridmanager.sentry.io';

/**
 * Other external links can be added here as needed
 */
export const EXTERNAL_LINKS = {
  sentry: SENTRY_URL,
} as const;
