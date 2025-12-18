/**
 * Season Form Validation Composable
 * Client-side validation logic for season forms
 */

import { reactive, computed } from 'vue';
import type { SeasonForm, SeasonFormErrors } from '@app/types/season';

export function useSeasonValidation(
  form: Pick<
    SeasonForm,
    'name' | 'car_class' | 'description' | 'technical_specs' | 'logo' | 'banner'
  >,
) {
  const errors = reactive<SeasonFormErrors>({});

  /**
   * Validate name
   */
  function validateName(): string | undefined {
    if (!form.name || !form.name.trim()) {
      return 'Season name is required';
    }
    if (form.name.trim().length < 3) {
      return 'Name must be at least 3 characters';
    }
    if (form.name.length > 100) {
      return 'Name must not exceed 100 characters';
    }
    return undefined;
  }

  /**
   * Validate car class
   */
  function validateCarClass(): string | undefined {
    if (form.car_class && form.car_class.length > 150) {
      return 'Car class must not exceed 150 characters';
    }
    return undefined;
  }

  /**
   * Validate description
   */
  function validateDescription(): string | undefined {
    if (form.description && form.description.length > 2000) {
      return 'Description must not exceed 2000 characters';
    }
    return undefined;
  }

  /**
   * Validate technical specs
   */
  function validateTechnicalSpecs(): string | undefined {
    if (form.technical_specs && form.technical_specs.length > 2000) {
      return 'Technical specs must not exceed 2000 characters';
    }
    return undefined;
  }

  /**
   * Validate logo
   */
  function validateLogo(): string | undefined {
    if (!form.logo) {
      return undefined; // Optional
    }

    // Check file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(form.logo.type)) {
      return 'Logo must be PNG or JPG format';
    }

    // Check file size (2MB max)
    const maxSize = 2 * 1024 * 1024;
    if (form.logo.size > maxSize) {
      return 'Logo must be less than 2MB';
    }

    return undefined;
  }

  /**
   * Validate banner
   */
  function validateBanner(): string | undefined {
    if (!form.banner) {
      return undefined; // Optional
    }

    // Check file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(form.banner.type)) {
      return 'Banner must be PNG or JPG format';
    }

    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (form.banner.size > maxSize) {
      return 'Banner must be less than 5MB';
    }

    return undefined;
  }

  /**
   * Validate all fields
   */
  function validateAll(): boolean {
    errors.name = validateName();
    errors.car_class = validateCarClass();
    errors.description = validateDescription();
    errors.technical_specs = validateTechnicalSpecs();
    errors.logo = validateLogo();
    errors.banner = validateBanner();

    return (
      !errors.name &&
      !errors.car_class &&
      !errors.description &&
      !errors.technical_specs &&
      !errors.logo &&
      !errors.banner
    );
  }

  /**
   * Clear all errors
   */
  function clearErrors(): void {
    errors.name = undefined;
    errors.car_class = undefined;
    errors.description = undefined;
    errors.technical_specs = undefined;
    errors.logo = undefined;
    errors.banner = undefined;
  }

  /**
   * Clear specific error
   */
  function clearError(field: keyof SeasonFormErrors): void {
    errors[field] = undefined;
  }

  const isValid = computed(() => {
    return (
      !errors.name &&
      !errors.car_class &&
      !errors.description &&
      !errors.technical_specs &&
      !errors.logo &&
      !errors.banner
    );
  });

  const hasErrors = computed(() => {
    return !!(
      errors.name ||
      errors.car_class ||
      errors.description ||
      errors.technical_specs ||
      errors.logo ||
      errors.banner
    );
  });

  return {
    errors,
    isValid,
    hasErrors,
    validateName,
    validateCarClass,
    validateDescription,
    validateTechnicalSpecs,
    validateLogo,
    validateBanner,
    validateAll,
    clearErrors,
    clearError,
  };
}
