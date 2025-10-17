import { ref, type Ref } from 'vue';
import { logger } from '@admin/utils/logger';

/**
 * Result type for async action execution
 */
export interface AsyncActionResult<T> {
  /**
   * Whether the action was successful
   */
  success: boolean;
  /**
   * Result data if successful
   */
  data?: T;
  /**
   * Error if failed
   */
  error?: unknown;
}

/**
 * Options for configuring async action behavior
 */
export interface AsyncActionOptions<T> {
  /**
   * Callback function executed on successful completion
   * @param data - The result data from the async function
   */
  onSuccess?: (data: T) => void | Promise<void>;

  /**
   * Callback function executed on error
   * @param error - The error that occurred
   */
  onError?: (error: unknown) => void | Promise<void>;

  /**
   * Callback function executed regardless of success or failure
   */
  onFinally?: () => void | Promise<void>;

  /**
   * Whether to log errors to console
   * @default true
   */
  logErrors?: boolean;

  /**
   * Custom error message for logging
   */
  errorMessage?: string;

  /**
   * Whether to throw errors after handling them
   * If false, errors are caught and returned in the result
   * @default false
   */
  throwOnError?: boolean;
}

/**
 * Return type for useAsyncAction composable
 */
export interface UseAsyncActionReturn<T> {
  /**
   * Whether the action is currently executing
   */
  isLoading: Ref<boolean>;

  /**
   * Error from the last execution (null if successful)
   */
  error: Ref<unknown | null>;

  /**
   * Result data from the last successful execution
   */
  data: Ref<T | null>;

  /**
   * Execute the async action with automatic loading state management
   */
  execute: (
    asyncFn: () => Promise<T>,
    options?: AsyncActionOptions<T>
  ) => Promise<AsyncActionResult<T>>;

  /**
   * Reset the state (loading, error, data) to initial values
   */
  reset: () => void;
}

/**
 * Composable for handling async operations with automatic loading state management
 *
 * This composable provides a standardized way to:
 * - Manage loading states during async operations
 * - Handle errors consistently
 * - Execute success/error/finally callbacks
 * - Store results and errors
 * - Provide type-safe return values
 *
 * @example Basic usage
 * ```typescript
 * const { execute, isLoading, error, data } = useAsyncAction<User>();
 *
 * const createUser = async () => {
 *   const result = await execute(
 *     () => userService.createUser(formData.value)
 *   );
 *
 *   if (result.success) {
 *     console.log('User created:', result.data);
 *   }
 * };
 * ```
 *
 * @example With callbacks
 * ```typescript
 * const { execute, isLoading } = useAsyncAction<User>();
 *
 * const createUser = async () => {
 *   await execute(
 *     () => userService.createUser(formData.value),
 *     {
 *       onSuccess: (user) => {
 *         toast.add({ severity: 'success', detail: 'User created!' });
 *         router.push(`/users/${user.id}`);
 *       },
 *       onError: (error) => {
 *         showErrorToast(error, 'Failed to create user');
 *       },
 *       onFinally: () => {
 *         closeModal();
 *       }
 *     }
 *   );
 * };
 * ```
 *
 * @example Multiple async actions with different loading states
 * ```typescript
 * const { execute: executeCreate, isLoading: creating } = useAsyncAction<User>();
 * const { execute: executeUpdate, isLoading: updating } = useAsyncAction<User>();
 * const { execute: executeDelete, isLoading: deleting } = useAsyncAction<void>();
 *
 * // Each action has its own independent loading state
 * ```
 *
 * @returns Object with loading state, error state, data, and execute method
 */
export function useAsyncAction<T = unknown>(): UseAsyncActionReturn<T> {
  const isLoading = ref(false);
  const error = ref<unknown | null>(null);
  const data = ref<T | null>(null);

  /**
   * Execute an async function with automatic state management
   *
   * @param asyncFn - The async function to execute
   * @param options - Configuration options for callbacks and error handling
   * @returns Result object with success status, data, and error
   */
  const execute = async (
    asyncFn: () => Promise<T>,
    options: AsyncActionOptions<T> = {}
  ): Promise<AsyncActionResult<T>> => {
    const {
      onSuccess,
      onError,
      onFinally,
      logErrors = true,
      errorMessage = 'Async action failed',
      throwOnError = false,
    } = options;

    // Reset previous error before executing
    error.value = null;
    isLoading.value = true;

    try {
      // Execute the async function
      const result = await asyncFn();

      // Store the result
      data.value = result as any;

      // Execute success callback if provided
      if (onSuccess) {
        await onSuccess(result);
      }

      return {
        success: true,
        data: result,
      };
    } catch (err) {
      // Store the error
      error.value = err;

      // Log error if enabled
      if (logErrors) {
        logger.error(errorMessage, err);
      }

      // Execute error callback if provided
      if (onError) {
        await onError(err);
      }

      // Re-throw error if configured to do so
      if (throwOnError) {
        throw err;
      }

      return {
        success: false,
        error: err,
      };
    } finally {
      isLoading.value = false;

      // Execute finally callback if provided
      if (onFinally) {
        await onFinally();
      }
    }
  };

  /**
   * Reset all state to initial values
   */
  const reset = (): void => {
    isLoading.value = false;
    error.value = null;
    data.value = null;
  };

  return {
    isLoading,
    error,
    data: data as Ref<T | null>,
    execute,
    reset,
  };
}

/**
 * Composable for managing multiple related async actions (e.g., create, update, delete)
 *
 * This is useful when you have several async operations in a single component
 * and want to track their loading states independently.
 *
 * @example
 * ```typescript
 * const {
 *   create: { execute: executeCreate, isLoading: creating },
 *   update: { execute: executeUpdate, isLoading: updating },
 *   delete: { execute: executeDelete, isLoading: deleting }
 * } = useAsyncActionGroup();
 *
 * // Each action has independent loading state
 * const handleCreate = () => executeCreate(() => userService.createUser(data));
 * const handleUpdate = () => executeUpdate(() => userService.updateUser(id, data));
 * const handleDelete = () => executeDelete(() => userService.deleteUser(id));
 * ```
 *
 * @returns Record of action keys to their useAsyncAction return values
 */
export function useAsyncActionGroup<
  T extends Record<string, unknown> = Record<string, unknown>,
>(): Record<keyof T, UseAsyncActionReturn<unknown>> {
  return new Proxy(
    {},
    {
      get: (_target, prop: string | symbol) => {
        if (typeof prop === 'string') {
          // Create a new async action for each property access
          // This allows dynamic action creation: group.anyActionName
          return useAsyncAction();
        }
        return undefined;
      },
    }
  ) as Record<keyof T, UseAsyncActionReturn<unknown>>;
}

/**
 * Helper function to create a named group of async actions
 *
 * This is more explicit than useAsyncActionGroup and provides better TypeScript support.
 *
 * @example
 * ```typescript
 * const actions = createAsyncActions({
 *   loadUsers: useAsyncAction<User[]>(),
 *   createUser: useAsyncAction<User>(),
 *   updateUser: useAsyncAction<User>(),
 *   deleteUser: useAsyncAction<void>(),
 * });
 *
 * // Use with full type safety
 * await actions.loadUsers.execute(() => userService.getAllUsers());
 * await actions.createUser.execute(() => userService.createUser(data));
 * ```
 *
 * @param actions - Record of action names to useAsyncAction instances
 * @returns The same record with full type information
 */
export function createAsyncActions<T extends Record<string, UseAsyncActionReturn<any>>>(
  actions: T
): T {
  return actions;
}
