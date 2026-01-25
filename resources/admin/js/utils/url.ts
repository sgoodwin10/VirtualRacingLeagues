/**
 * URL utility functions for constructing cross-subdomain URLs
 */

/**
 * Build a full URL with protocol, domain, and port (if needed)
 *
 * @param domain - The domain (e.g., 'app.virtualracingleagues.localhost')
 * @param path - The path (e.g., '/login-as')
 * @param includePort - Whether to include the current port (default: true)
 * @returns Full URL with protocol, domain, optional port, and path
 *
 * @example
 * // Development (port 8000)
 * buildUrl('app.virtualracingleagues.localhost', '/login-as?token=xyz')
 * // Returns: 'http://app.virtualracingleagues.localhost:8000/login-as?token=xyz'
 *
 * @example
 * // Production (default port 443)
 * buildUrl('app.example.com', '/login-as?token=xyz')
 * // Returns: 'https://app.example.com/login-as?token=xyz'
 */
export function buildUrl(domain: string, path: string, includePort = true): string {
  const protocol = window.location.protocol;
  const port = window.location.port;

  // Only include port if:
  // 1. includePort is true
  // 2. Port exists
  // 3. Port is not default (80 for http, 443 for https)
  const shouldIncludePort =
    includePort &&
    port &&
    !((protocol === 'http:' && port === '80') || (protocol === 'https:' && port === '443'));

  const portPart = shouldIncludePort ? `:${port}` : '';

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${protocol}//${domain}${portPart}${normalizedPath}`;
}

/**
 * Build a login-as impersonation URL
 *
 * @param token - The impersonation token
 * @returns Full URL for user impersonation
 *
 * @example
 * buildLoginAsUrl('abc123')
 * // Returns: 'http://app.virtualracingleagues.localhost:8000/login-as?token=abc123'
 */
export function buildLoginAsUrl(token: string): string {
  const appDomain = import.meta.env.VITE_APP_DOMAIN;

  if (!appDomain) {
    throw new Error('VITE_APP_DOMAIN environment variable is not configured');
  }

  return buildUrl(appDomain, `/login-as?token=${token}`);
}
