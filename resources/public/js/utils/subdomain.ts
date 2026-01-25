/**
 * Subdomain Utilities
 * Helper functions for managing subdomain URLs
 */

/**
 * Get the app subdomain URL
 * @returns The full URL for the app subdomain
 */
export function getAppSubdomainUrl(): string {
  // VITE_APP_DOMAIN already includes 'app.' prefix
  // Use dynamic protocol detection to support both HTTP and HTTPS
  const protocol = window.location.protocol;
  return `${protocol}//${import.meta.env.VITE_APP_DOMAIN}`;
}
