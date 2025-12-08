/**
 * Global modal state management
 * This module maintains a counter of open modals to manage body scroll lock
 */

let modalCount = 0;

/**
 * Get the current modal count
 */
export const getModalCount = (): number => {
  return modalCount;
};

/**
 * Increment the modal count and return the new count
 */
export const incrementModalCount = (): number => {
  modalCount++;
  return modalCount;
};

/**
 * Decrement the modal count and return the new count
 */
export const decrementModalCount = (): number => {
  modalCount--;
  if (modalCount < 0) {
    modalCount = 0;
  }
  return modalCount;
};

/**
 * Reset the modal count to 0 (useful for testing)
 */
export const resetModalCount = (): void => {
  modalCount = 0;
  document.body.style.overflow = '';
};

// Export for backwards compatibility
export { modalCount };
