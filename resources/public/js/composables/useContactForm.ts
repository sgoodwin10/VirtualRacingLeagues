import { reactive, computed, type ComputedRef } from 'vue';

export interface ContactForm {
  name: string;
  email: string;
  reason: string;
  message: string;
}

export interface ContactErrors {
  name: string;
  email: string;
  reason: string;
  message: string;
}

export interface UseContactForm {
  errors: ContactErrors;
  isValid: ComputedRef<boolean>;
  hasErrors: ComputedRef<boolean>;
  validateAll: () => boolean;
  validateReason: () => boolean;
  validateMessage: () => boolean;
  validateName: () => boolean;
  validateEmail: () => boolean;
  clearError: (field: keyof ContactErrors) => void;
  clearErrors: () => void;
}

/**
 * Composable for contact form validation
 */
export function useContactForm(form: ContactForm): UseContactForm {
  const errors = reactive<ContactErrors>({
    name: '',
    email: '',
    reason: '',
    message: '',
  });

  /**
   * Validate the name field
   */
  function validateName(): boolean {
    errors.name = '';
    if (!form.name?.trim()) {
      errors.name = 'Name is required';
      return false;
    }
    return true;
  }

  /**
   * Validate the email field
   */
  function validateEmail(): boolean {
    errors.email = '';
    if (!form.email?.trim()) {
      errors.email = 'Email is required';
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      errors.email = 'Please enter a valid email address';
      return false;
    }
    return true;
  }

  /**
   * Validate the reason field
   */
  function validateReason(): boolean {
    errors.reason = '';
    if (!form.reason) {
      errors.reason = 'Please select a reason for contact';
      return false;
    }
    return true;
  }

  /**
   * Validate the message field
   */
  function validateMessage(): boolean {
    errors.message = '';
    if (!form.message.trim()) {
      errors.message = 'Message is required';
      return false;
    }
    if (form.message.length > 2000) {
      errors.message = 'Message must be 2000 characters or less';
      return false;
    }
    return true;
  }

  /**
   * Validate all fields
   */
  function validateAll(): boolean {
    const results = [validateName(), validateEmail(), validateReason(), validateMessage()];
    return results.every(Boolean);
  }

  /**
   * Clear a specific error
   */
  function clearError(field: keyof ContactErrors): void {
    errors[field] = '';
  }

  /**
   * Clear all errors
   */
  function clearErrors(): void {
    errors.name = '';
    errors.email = '';
    errors.reason = '';
    errors.message = '';
  }

  /**
   * Computed property to check if form is valid
   */
  const isValid = computed(() => {
    return (
      !!form.name?.trim() &&
      !!form.email?.trim() &&
      !!form.reason &&
      !!form.message.trim() &&
      form.message.length <= 2000
    );
  });

  /**
   * Computed property to check if there are any errors
   */
  const hasErrors = computed(() => {
    return Object.values(errors).some(Boolean);
  });

  return {
    errors,
    isValid,
    hasErrors,
    validateAll,
    validateReason,
    validateMessage,
    validateName,
    validateEmail,
    clearError,
    clearErrors,
  };
}
