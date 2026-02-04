/**
 * Site Configuration Interface
 *
 * This interface defines the shape of the site configuration data
 * that is passed from the Laravel backend to the frontend via
 * window.__SITE_CONFIG__.
 */
export interface SiteConfig {
  name: string;
  timezone: string;
  discord: {
    url: string | null;
    inviteCode: string | null;
  };
  maintenance: {
    enabled: boolean;
    message: string;
  };
  registration: {
    enabled: boolean;
  };
  google: {
    analyticsId: string | null;
    tagManagerId: string | null;
    searchConsoleCode: string | null;
  };
  emails: {
    support: string | null;
    contact: string | null;
    admin: string | null;
  };
}

/**
 * Global window interface augmentation
 */
declare global {
  interface Window {
    __SITE_CONFIG__: SiteConfig;
  }
}

/**
 * Get site configuration from window object
 */
export function getSiteConfig(): SiteConfig {
  return window.__SITE_CONFIG__;
}
