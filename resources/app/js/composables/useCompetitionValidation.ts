/**
 * Competition Form Validation Composable
 * Client-side validation logic
 */

import { reactive, computed } from 'vue';
import type { CompetitionForm, CompetitionFormErrors } from '@app/types/competition';

export function useCompetitionValidation(form: CompetitionForm) {
  const errors = reactive<CompetitionFormErrors>({});

  /**
   * Validate name
   */
  function validateName(): string | undefined {
    if (!form.name || !form.name.trim()) {
      return 'Competition name is required';
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
   * Validate platform
   */
  function validatePlatform(): string | undefined {
    if (!form.platform_id) {
      return 'Platform is required';
    }
    return undefined;
  }

  /**
   * Validate description
   */
  function validateDescription(): string | undefined {
    if (form.description && form.description.length > 1000) {
      return 'Description must not exceed 1000 characters';
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
   * Validate competition_colour (optional, no specific validation needed)
   */
  function validateCompetitionColour(): string | undefined {
    // Colour is optional and PrimeVue ColorPicker ensures valid RGB format
    return undefined;
  }

  /**
   * Validate all fields
   */
  function validateAll(): boolean {
    errors.name = validateName();
    errors.platform_id = validatePlatform();
    errors.description = validateDescription();
    errors.logo = validateLogo();
    errors.competition_colour = validateCompetitionColour();

    return (
      !errors.name &&
      !errors.platform_id &&
      !errors.description &&
      !errors.logo &&
      !errors.competition_colour
    );
  }

  /**
   * Clear all errors
   */
  function clearErrors(): void {
    errors.name = undefined;
    errors.platform_id = undefined;
    errors.description = undefined;
    errors.logo = undefined;
    errors.competition_colour = undefined;
  }

  /**
   * Clear specific error
   */
  function clearError(field: keyof CompetitionFormErrors): void {
    errors[field] = undefined;
  }

  const isValid = computed(() => {
    return (
      !errors.name &&
      !errors.platform_id &&
      !errors.description &&
      !errors.logo &&
      !errors.competition_colour
    );
  });

  const hasErrors = computed(() => {
    return !!(
      errors.name ||
      errors.platform_id ||
      errors.description ||
      errors.logo ||
      errors.competition_colour
    );
  });

  return {
    errors,
    isValid,
    hasErrors,
    validateName,
    validatePlatform,
    validateDescription,
    validateLogo,
    validateCompetitionColour,
    validateAll,
    clearErrors,
    clearError,
  };
}
