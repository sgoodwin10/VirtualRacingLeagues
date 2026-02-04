/**
 * Global Type Declarations
 * Extends global interfaces for the app dashboard
 */

// Extend Window interface for Google Tag Manager dataLayer
declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export {};
