/**
 * Media Types
 * Types for responsive media objects with conversions
 */

/**
 * Available image conversions
 * These match the backend media library conversion names
 */
export interface MediaConversions {
  /** Thumbnail size - 150px width */
  thumb: string;
  /** Small size - 320px width */
  small: string;
  /** Medium size - 640px width */
  medium: string;
  /** Large size - 1280px width */
  large: string;
  /** Open Graph size - optimized for social sharing (optional) */
  og?: string;
}

/**
 * Media object with responsive conversions
 * Returned by backend for images processed through media library
 */
export interface MediaObject {
  /** Media ID */
  id: number;
  /** Original image URL */
  original: string;
  /** Responsive image conversions */
  conversions: MediaConversions;
  /** Precomputed srcset attribute for responsive images */
  srcset: string;
}
