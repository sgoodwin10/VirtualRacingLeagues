/**
 * URL Sanitization Utility
 *
 * Provides functions to sanitize URLs to prevent XSS attacks.
 * Only allows safe protocols and validates URL structure.
 */

/**
 * List of allowed URL protocols for images
 */
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'data:'];

/**
 * List of dangerous protocols that should be blocked
 */
const DANGEROUS_PROTOCOLS = ['javascript:', 'vbscript:', 'file:', 'data:text/html', 'blob:'];

/**
 * Sanitizes an image URL to prevent XSS attacks.
 *
 * @param url - The URL to sanitize
 * @returns The sanitized URL if valid, null if invalid or dangerous
 *
 * @example
 * ```typescript
 * sanitizeImageUrl('https://example.com/image.jpg') // Returns: 'https://example.com/image.jpg'
 * sanitizeImageUrl('javascript:alert(1)') // Returns: null
 * sanitizeImageUrl('data:image/png;base64,iVBOR...') // Returns: 'data:image/png;base64,iVBOR...'
 * ```
 */
export function sanitizeImageUrl(url: string | undefined | null): string | null {
  // Handle null, undefined, or empty strings
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return null;
  }

  const trimmedUrl = url.trim();

  // Check for dangerous protocols first (case-insensitive)
  const lowerUrl = trimmedUrl.toLowerCase();
  for (const dangerous of DANGEROUS_PROTOCOLS) {
    if (lowerUrl.startsWith(dangerous)) {
      console.warn(`[URL Sanitizer] Blocked dangerous protocol in URL: ${dangerous}`);
      return null;
    }
  }

  // Check for encoded dangerous characters
  if (
    lowerUrl.includes('%3c') || // <
    lowerUrl.includes('%3e') || // >
    lowerUrl.includes('%22') || // "
    lowerUrl.includes('%27') || // '
    lowerUrl.includes('&#') // HTML entities
  ) {
    console.warn('[URL Sanitizer] Blocked URL with encoded dangerous characters');
    return null;
  }

  // Handle relative URLs (start with /)
  if (trimmedUrl.startsWith('/')) {
    // Relative URLs are safe - they can't execute scripts
    return trimmedUrl;
  }

  try {
    // Handle data URLs separately (for base64 images)
    if (lowerUrl.startsWith('data:')) {
      // Only allow image data URLs
      if (!lowerUrl.startsWith('data:image/')) {
        console.warn('[URL Sanitizer] Blocked non-image data URL');
        return null;
      }
      // Validate data URL structure: data:image/[type];base64,[data]
      const dataUrlRegex = /^data:image\/(png|jpg|jpeg|gif|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/i;
      if (!dataUrlRegex.test(trimmedUrl)) {
        console.warn('[URL Sanitizer] Invalid data URL format');
        return null;
      }
      return trimmedUrl;
    }

    // Parse the URL to validate structure
    const urlObject = new URL(trimmedUrl);

    // Check if protocol is allowed
    if (!ALLOWED_PROTOCOLS.includes(urlObject.protocol)) {
      console.warn(`[URL Sanitizer] Blocked disallowed protocol: ${urlObject.protocol}`);
      return null;
    }

    // Additional validation: ensure hostname exists for http/https
    if (
      (urlObject.protocol === 'http:' || urlObject.protocol === 'https:') &&
      !urlObject.hostname
    ) {
      console.warn('[URL Sanitizer] Invalid URL: missing hostname');
      return null;
    }

    // Return the sanitized URL
    return trimmedUrl;
  } catch (error) {
    // URL constructor will throw if URL is invalid
    console.warn('[URL Sanitizer] Invalid URL format:', error);
    return null;
  }
}

/**
 * Gets a sanitized image URL or returns a fallback if invalid.
 *
 * @param url - The URL to sanitize
 * @param fallback - Optional fallback URL to use if the input is invalid
 * @returns The sanitized URL or fallback
 *
 * @example
 * ```typescript
 * getSafeImageUrl('https://example.com/image.jpg', '/default.jpg')
 * // Returns: 'https://example.com/image.jpg'
 *
 * getSafeImageUrl('javascript:alert(1)', '/default.jpg')
 * // Returns: '/default.jpg'
 * ```
 */
export function getSafeImageUrl(url: string | undefined | null, fallback?: string): string | null {
  const sanitized = sanitizeImageUrl(url);
  if (sanitized === null && fallback) {
    return sanitizeImageUrl(fallback);
  }
  return sanitized;
}
