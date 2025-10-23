/**
 * Test configuration and URL helpers for E2E tests
 *
 * Centralizes URL construction to avoid hardcoding and make tests
 * more maintainable across different environments.
 *
 * Tests should be run from the host machine where subdomain URLs
 * resolve properly via /etc/hosts.
 */

// Read from environment or use defaults
const BASE_DOMAIN = process.env.TEST_DOMAIN || 'virtualracingleagues.localhost';

/**
 * Build URL for testing
 * Uses subdomain.localhost format
 */
function buildUrl(subdomain: string = '', path: string = '/'): string {
  const domain = subdomain ? `${subdomain}.${BASE_DOMAIN}` : BASE_DOMAIN;
  return `http://${domain}${path}`;
}

/**
 * Test URLs for different subdomains
 */
export const TEST_URLS = {
  // Public site URLs
  public: {
    home: buildUrl('', '/'),
    login: buildUrl('', '/login'),
    register: buildUrl('', '/register'),
    forgotPassword: buildUrl('', '/forgot-password'),
    resetPassword: buildUrl('', '/reset-password'),
  },

  // User dashboard URLs
  user: {
    home: buildUrl('app', '/'),
    profile: buildUrl('app', '/profile'),
    dashboard: buildUrl('app', '/'),
  },

  // Admin dashboard URLs
  admin: {
    home: buildUrl('admin', '/'),
    login: buildUrl('admin', '/login'),
    dashboard: buildUrl('admin', '/'),
    users: buildUrl('admin', '/users'),
    adminUsers: buildUrl('admin', '/admin-users'),
    settings: buildUrl('admin', '/settings'),
    siteConfig: buildUrl('admin', '/site-config'),
    activityLogs: buildUrl('admin', '/activity-logs'),
  },
} as const;

/**
 * Test credentials
 */
export const TEST_CREDENTIALS = {
  admin: {
    email: 'admin@example.com',
    password: 'password',
  },
  superAdmin: {
    email: 'superadmin@example.com',
    password: 'password',
  },
  moderator: {
    email: 'moderator@example.com',
    password: 'password',
  },
  invalidUser: {
    email: 'wrong@example.com',
    password: 'wrongpassword',
  },
} as const;

/**
 * Common test timeouts
 */
export const TEST_TIMEOUTS = {
  vueAppMount: 10000,
  navigation: 10000,
  apiResponse: 5000,
} as const;
