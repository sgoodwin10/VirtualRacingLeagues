/**
 * Season-Driver Form Validation Composable
 * Client-side validation logic for season-driver assignment forms
 */

import { reactive, computed } from 'vue';
import type { SeasonDriverForm, SeasonDriverFormErrors } from '@app/types/seasonDriver';

export function useSeasonDriverValidation(form: SeasonDriverForm) {
  const errors = reactive<SeasonDriverFormErrors>({});

  /**
   * Validate status
   */
  function validateStatus(): string | undefined {
    if (!form.status) {
      return 'Status is required';
    }
    const validStatuses = ['active', 'reserve', 'withdrawn'];
    if (!validStatuses.includes(form.status)) {
      return 'Invalid status value';
    }
    return undefined;
  }

  /**
   * Validate notes
   */
  function validateNotes(): string | undefined {
    if (form.notes && form.notes.length > 1000) {
      return 'Notes must not exceed 1000 characters';
    }
    return undefined;
  }

  /**
   * Validate all fields
   */
  function validateAll(): boolean {
    errors.status = validateStatus();
    errors.notes = validateNotes();

    return !errors.status && !errors.notes;
  }

  /**
   * Clear all errors
   */
  function clearErrors(): void {
    errors.status = undefined;
    errors.notes = undefined;
  }

  /**
   * Clear specific error
   */
  function clearError(field: keyof SeasonDriverFormErrors): void {
    errors[field] = undefined;
  }

  const isValid = computed(() => {
    return !errors.status && !errors.notes;
  });

  const hasErrors = computed(() => {
    return !!(errors.status || errors.notes);
  });

  return {
    errors,
    isValid,
    hasErrors,
    validateStatus,
    validateNotes,
    validateAll,
    clearErrors,
    clearError,
  };
}
