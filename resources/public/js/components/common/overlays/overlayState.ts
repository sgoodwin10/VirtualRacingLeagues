/**
 * Global overlay state management
 * This module maintains a counter of open overlays (modals, dialogs, drawers)
 * to manage body scroll lock across all overlay components
 */

let overlayCount = 0;

/**
 * Get the current overlay count
 */
export const getOverlayCount = (): number => {
  return overlayCount;
};

/**
 * Increment the overlay count and return the new count
 */
export const incrementOverlayCount = (): number => {
  overlayCount++;
  return overlayCount;
};

/**
 * Decrement the overlay count and return the new count
 */
export const decrementOverlayCount = (): number => {
  overlayCount--;
  if (overlayCount < 0) {
    overlayCount = 0;
  }
  return overlayCount;
};

/**
 * Reset the overlay count to 0 (useful for testing)
 */
export const resetOverlayCount = (): void => {
  overlayCount = 0;
  document.body.style.overflow = '';
};

// Export for backwards compatibility
export { overlayCount };
