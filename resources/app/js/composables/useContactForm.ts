import { reactive, computed } from 'vue';

interface ContactForm {
  reason: string;
  message: string;
  name?: string;
  email?: string;
}

interface ContactErrors {
  reason: string;
  message: string;
  name: string;
  email: string;
}

/**
 * Composable for contact form validation
 *
 * @param form - The reactive form object to validate
 * @param requireUserInfo - Whether to require name and email fields (for public site)
 * @returns Validation state and methods
 *
 * @example
 * ```typescript
 * const form = reactive({ reason: '', message: '' });
 * const { errors, isValid, validateAll, clearError } = useContactForm(form);
 * ```
 */
export function useContactForm(form: ContactForm, requireUserInfo = false) {
  const errors = reactive<ContactErrors>({
    reason: '',
    message: '',
    name: '',
    email: '',
  });

  function validateReason(): boolean {
    errors.reason = '';
    if (!form.reason) {
      errors.reason = 'Please select a reason for contact';
      return false;
    }
    return true;
  }

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

  function validateName(): boolean {
    if (!requireUserInfo) return true;
    errors.name = '';
    if (!form.name?.trim()) {
      errors.name = 'Name is required';
      return false;
    }
    return true;
  }

  function validateEmail(): boolean {
    if (!requireUserInfo) return true;
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

  function validateAll(): boolean {
    const results = [validateReason(), validateMessage(), validateName(), validateEmail()];
    return results.every(Boolean);
  }

  function clearError(field: keyof ContactErrors): void {
    errors[field] = '';
  }

  function clearErrors(): void {
    errors.reason = '';
    errors.message = '';
    errors.name = '';
    errors.email = '';
  }

  const isValid = computed(() => {
    const baseValid = !!form.reason && !!form.message.trim();
    if (requireUserInfo) {
      return baseValid && !!form.name?.trim() && !!form.email?.trim();
    }
    return baseValid;
  });

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
