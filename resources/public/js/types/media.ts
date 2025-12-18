/**
 * Media types for responsive images
 * These types correspond to the Laravel Media Library responsive images implementation
 */

/**
 * Available image conversions (responsive sizes)
 */
export interface MediaConversions {
  thumb: string; // 150w
  small: string; // 320w
  medium: string; // 640w
  large: string; // 1280w
  og?: string; // Open Graph image (optional)
}

/**
 * Media object with responsive images
 */
export interface MediaObject {
  id: number;
  original: string;
  conversions: MediaConversions;
  srcset: string; // Pre-built srcset attribute
}
