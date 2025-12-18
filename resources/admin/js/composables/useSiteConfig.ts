import { ref } from 'vue';
import { siteConfigService } from '@admin/services/siteConfigService';
import { useSiteConfigStore } from '@admin/stores/siteConfigStore';
import { useRequestCancellation } from '@admin/composables/useRequestCancellation';
import type {
  SiteConfig,
  UpdateSiteConfigRequest,
  ValidationErrors,
} from '@admin/types/siteConfig';
import { logger } from '@admin/utils/logger';
import { isAxiosError } from '@admin/types/errors';

/**
 * Composable for managing site configuration
 * Provides reactive state and methods for fetching and updating site configuration
 *
 * @returns Site configuration state and methods
 *
 * @example
 * ```typescript
 * const {
 *   config,
 *   loading,
 *   saving,
 *   error,
 *   validationErrors,
 *   fetchConfig,
 *   updateConfig,
 *   getFieldError,
 *   hasFieldError,
 * } = useSiteConfig();
 *
 * // Fetch configuration
 * await fetchConfig();
 *
 * // Update configuration
 * const success = await updateConfig({
 *   app_name: 'My App',
 *   app_url: 'https://example.com',
 * });
 *
 * // Check for field errors
 * if (hasFieldError('app_name')) {
 *   const errorMessage = getFieldError('app_name');
 * }
 * ```
 */
export function useSiteConfig() {
  // Pinia store
  const siteConfigStore = useSiteConfigStore();

  // Request cancellation
  const { getSignal } = useRequestCancellation();

  // State
  const config = ref<SiteConfig | null>(null);
  const loading = ref(false);
  const saving = ref(false);
  const error = ref<string | null>(null);
  const validationErrors = ref<ValidationErrors>({});

  /**
   * Fetch site configuration from API
   * Sets loading state and handles errors
   * Automatically cancels request on component unmount
   *
   * @returns Promise that resolves when config is fetched
   *
   * @example
   * ```typescript
   * await fetchConfig();
   * console.log(config.value?.app_name);
   * ```
   */
  const fetchConfig = async (): Promise<void> => {
    loading.value = true;
    error.value = null;

    try {
      config.value = await siteConfigService.getSiteConfig(getSignal());
    } catch (err) {
      if (err instanceof Error) {
        error.value = err.message;
      } else {
        error.value = 'Failed to fetch site configuration';
      }
      logger.error('Error fetching site config:', err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * Update site configuration with provided data
   * Sets saving state, handles validation errors, and returns success status
   * Also updates the Pinia store with the new configuration
   * Automatically cancels request on component unmount
   *
   * @param data - The configuration data to update
   * @returns Promise that resolves to true if successful, false otherwise
   *
   * @example
   * ```typescript
   * const success = await updateConfig({
   *   app_name: 'New App Name',
   *   app_url: 'https://newurl.com',
   * });
   *
   * if (success) {
   *   // Config updated successfully
   *   // Pinia store is automatically updated
   * } else {
   *   // Check validationErrors.value for errors
   * }
   * ```
   */
  const updateConfig = async (data: UpdateSiteConfigRequest): Promise<boolean> => {
    saving.value = true;
    error.value = null;
    validationErrors.value = {};

    try {
      const updatedConfig = await siteConfigService.updateSiteConfig(data, getSignal());
      config.value = updatedConfig;

      // Update the Pinia store with the new configuration
      siteConfigStore.updateConfig(updatedConfig);

      logger.info('Site configuration updated successfully');
      return true;
    } catch (err) {
      // Handle validation errors
      if (isAxiosError(err) && err.response?.data) {
        const responseData = err.response.data as { errors?: ValidationErrors };
        if (responseData.errors) {
          validationErrors.value = responseData.errors;
          error.value = 'Please correct the validation errors';
        }
      } else if (err instanceof Error) {
        error.value = err.message;
      } else {
        error.value = 'Failed to update site configuration';
      }
      logger.error('Error updating site config:', err);
      return false;
    } finally {
      saving.value = false;
    }
  };

  /**
   * Clear all validation errors and general error message
   *
   * @example
   * ```typescript
   * clearValidationErrors();
   * ```
   */
  const clearValidationErrors = (): void => {
    validationErrors.value = {};
    error.value = null;
  };

  /**
   * Get the first validation error message for a specific field
   *
   * @param fieldName - The name of the field to get error for
   * @returns The error message or null if no error exists
   *
   * @example
   * ```typescript
   * const appNameError = getFieldError('app_name');
   * if (appNameError) {
   *   console.log(appNameError); // "The app name field is required"
   * }
   * ```
   */
  const getFieldError = (fieldName: string): string | null => {
    const errors = validationErrors.value[fieldName];
    return errors && errors.length > 0 ? errors[0] || null : null;
  };

  /**
   * Check if a field has any validation errors
   *
   * @param fieldName - The name of the field to check
   * @returns True if the field has validation errors, false otherwise
   *
   * @example
   * ```typescript
   * if (hasFieldError('app_name')) {
   *   // Show error UI
   * }
   * ```
   */
  const hasFieldError = (fieldName: string): boolean => {
    return !!validationErrors.value[fieldName]?.length;
  };

  return {
    // State
    config,
    loading,
    saving,
    error,
    validationErrors,

    // Methods
    fetchConfig,
    updateConfig,
    clearValidationErrors,
    getFieldError,
    hasFieldError,
  };
}

export type UseSiteConfigReturn = ReturnType<typeof useSiteConfig>;
