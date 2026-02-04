/**
 * Site Configuration Types
 * Used for public site configuration settings
 */

/**
 * Site configuration response from API
 */
export interface SiteConfig {
  user_registration_enabled: boolean;
  discord_url: string | null;
}
