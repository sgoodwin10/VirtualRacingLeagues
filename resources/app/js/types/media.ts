/**
 * Media-related TypeScript types and interfaces for responsive images
 */

/**
 * Media conversions interface representing different image sizes
 */
export interface MediaConversions {
  thumb: string;
  small: string;
  medium: string;
  large: string;
  og?: string;
}

/**
 * Media object interface representing a complete media item with conversions
 */
export interface MediaObject {
  id: number;
  original: string;
  conversions: MediaConversions;
  srcset: string;
}
