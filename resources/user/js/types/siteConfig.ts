/**
 * Site Configuration Types
 * Defines the shape of site-wide configuration data
 */

/**
 * Site configuration data returned from the API
 */
export interface SiteConfig {
  /**
   * Site name displayed across the application
   */
  siteName: string;

  /**
   * Site description for meta tags and SEO
   */
  siteDescription: string;

  /**
   * Google Analytics tracking ID (optional)
   */
  googleAnalyticsId?: string;

  /**
   * Facebook Pixel ID (optional)
   */
  facebookPixelId?: string;

  /**
   * Site logo URL (optional)
   */
  logoUrl?: string;

  /**
   * Site favicon URL (optional)
   */
  faviconUrl?: string;

  /**
   * Support email address
   */
  supportEmail?: string;

  /**
   * Contact email address
   */
  contactEmail?: string;

  /**
   * Enable/disable user registrations
   */
  registrationsEnabled?: boolean;

  /**
   * Enable/disable maintenance mode
   */
  maintenanceMode?: boolean;

  /**
   * Maintenance mode message
   */
  maintenanceMessage?: string;

  /**
   * Additional custom configuration options
   */
  custom?: Record<string, unknown>;
}

/**
 * API response wrapper for site config endpoint
 */
export interface SiteConfigResponse {
  data: SiteConfig;
  message?: string;
}
