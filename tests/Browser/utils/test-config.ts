/**
 * Test configuration and URL helpers for E2E tests
 *
 * Centralizes URL construction to avoid hardcoding and make tests
 * more maintainable across different environments.
 */

// Read from environment or use defaults
const BASE_DOMAIN = process.env.TEST_DOMAIN || 'virtualracingleagues.localhost';
const BASE_PORT = process.env.TEST_PORT || '8000';

/**
 * Build URL with optional port
 */
function buildUrl(subdomain: string = '', path: string = '/'): string {
    const domain = subdomain ? `${subdomain}.${BASE_DOMAIN}` : BASE_DOMAIN;
    const url = `http://${domain}:${BASE_PORT}${path}`;
    return url;
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
        home: buildUrl('admin', '/admin/'),
        login: buildUrl('admin', '/admin/login'),
        dashboard: buildUrl('admin', '/admin/'),
        users: buildUrl('admin', '/admin/users'),
        adminUsers: buildUrl('admin', '/admin/admin-users'),
        settings: buildUrl('admin', '/admin/settings'),
        siteConfig: buildUrl('admin', '/admin/site-config'),
        activityLogs: buildUrl('admin', '/admin/activity-logs'),
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
