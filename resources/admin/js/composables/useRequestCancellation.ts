import { ref, onUnmounted } from 'vue';
import { logger } from '@admin/utils/logger';

/**
 * Composable for managing request cancellation with AbortController
 *
 * Features:
 * - Automatic cleanup on component unmount
 * - Support for manual cancellation
 * - Ability to reset controller for new requests
 * - Multiple request tracking (optional)
 *
 * @example
 * ```typescript
 * const { getSignal, cancel, reset } = useRequestCancellation();
 *
 * const loadData = async () => {
 *   try {
 *     const data = await apiService.get('/data', { signal: getSignal() });
 *     // Process data...
 *   } catch (error) {
 *     if (axios.isCancel(error)) {
 *       logger.info('Request cancelled');
 *       return;
 *     }
 *     // Handle other errors...
 *   }
 * };
 * ```
 */
export function useRequestCancellation() {
  const controller = ref<AbortController>(new AbortController());

  /**
   * Get the current AbortSignal for passing to API requests
   * @returns The current AbortSignal
   */
  const getSignal = (): AbortSignal => {
    return controller.value.signal;
  };

  /**
   * Cancel all pending requests and create a new controller
   * @param reason - Optional reason for cancellation (useful for debugging)
   */
  const cancel = (reason?: string): void => {
    if (controller.value.signal.aborted) {
      logger.debug('Controller already aborted, creating new one');
    } else {
      logger.debug('Cancelling requests', reason ? `(${reason})` : '');
      controller.value.abort(reason);
    }
    // Create a new controller for future requests
    controller.value = new AbortController();
  };

  /**
   * Reset the controller (create a new one without aborting the current one)
   * Use this when you want to start fresh without cancelling pending requests
   */
  const reset = (): void => {
    logger.debug('Resetting request controller');
    controller.value = new AbortController();
  };

  /**
   * Check if the current controller is aborted
   * @returns True if aborted, false otherwise
   */
  const isAborted = (): boolean => {
    return controller.value.signal.aborted;
  };

  // Automatically cancel all pending requests when component unmounts
  onUnmounted(() => {
    cancel('Component unmounted');
  });

  return {
    /**
     * Get the current AbortSignal for API requests
     */
    getSignal,
    /**
     * Cancel all pending requests and reset the controller
     */
    cancel,
    /**
     * Reset the controller without cancelling pending requests
     */
    reset,
    /**
     * Check if the controller is currently aborted
     */
    isAborted,
  };
}

/**
 * Composable for managing multiple concurrent requests with individual cancellation
 *
 * Use this when you need to cancel specific requests independently.
 * For example, when making multiple API calls that should be independently cancellable.
 *
 * @example
 * ```typescript
 * const { createSignal, cancel, cancelAll } = useMultipleRequestCancellation();
 *
 * const loadUsers = async () => {
 *   const signal = createSignal('users');
 *   try {
 *     const users = await userService.getAllUsers({}, signal);
 *     // Process users...
 *   } catch (error) {
 *     if (axios.isCancel(error)) return;
 *     // Handle error...
 *   }
 * };
 *
 * const loadAdmins = async () => {
 *   const signal = createSignal('admins');
 *   try {
 *     const admins = await adminService.getAllAdmins({}, signal);
 *     // Process admins...
 *   } catch (error) {
 *     if (axios.isCancel(error)) return;
 *     // Handle error...
 *   }
 * };
 *
 * // Cancel just the users request
 * cancel('users');
 *
 * // Or cancel all requests
 * cancelAll();
 * ```
 */
export function useMultipleRequestCancellation() {
  const controllers = ref<Map<string, AbortController>>(new Map());

  /**
   * Create a new AbortSignal for a specific request
   * @param key - Unique identifier for the request
   * @returns AbortSignal for the request
   */
  const createSignal = (key: string): AbortSignal => {
    // Cancel and remove any existing controller with this key
    if (controllers.value.has(key)) {
      const existingController = controllers.value.get(key);
      if (existingController && !existingController.signal.aborted) {
        existingController.abort(`Replacing request: ${key}`);
      }
    }

    // Create and store new controller
    const controller = new AbortController();
    controllers.value.set(key, controller);
    return controller.signal;
  };

  /**
   * Cancel a specific request by key
   * @param key - The request identifier to cancel
   * @param reason - Optional reason for cancellation
   */
  const cancel = (key: string, reason?: string): void => {
    const controller = controllers.value.get(key);
    if (controller && !controller.signal.aborted) {
      logger.debug(`Cancelling request: ${key}`, reason ? `(${reason})` : '');
      controller.abort(reason);
      controllers.value.delete(key);
    }
  };

  /**
   * Cancel all pending requests
   * @param reason - Optional reason for cancellation
   */
  const cancelAll = (reason?: string): void => {
    logger.debug('Cancelling all requests', reason ? `(${reason})` : '');
    controllers.value.forEach((controller, _key) => {
      if (!controller.signal.aborted) {
        controller.abort(reason);
      }
    });
    controllers.value.clear();
  };

  /**
   * Check if a specific request is aborted
   * @param key - The request identifier to check
   * @returns True if aborted or doesn't exist, false otherwise
   */
  const isAborted = (key: string): boolean => {
    const controller = controllers.value.get(key);
    return !controller || controller.signal.aborted;
  };

  // Automatically cancel all pending requests when component unmounts
  onUnmounted(() => {
    cancelAll('Component unmounted');
  });

  return {
    /**
     * Create a new AbortSignal for a specific request
     */
    createSignal,
    /**
     * Cancel a specific request by key
     */
    cancel,
    /**
     * Cancel all pending requests
     */
    cancelAll,
    /**
     * Check if a specific request is aborted
     */
    isAborted,
  };
}
