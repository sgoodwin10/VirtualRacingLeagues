import { ref, computed } from 'vue';
import { useUserStore } from '@app/stores/userStore';
import { useToast } from 'primevue/usetoast';
import { isAxiosError, hasValidationErrors } from '@app/types/errors';

interface ProfileFormData {
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  password_confirmation?: string;
  current_password?: string;
}

interface ProfileFormErrors {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  currentPassword: string;
  general: string;
}

export function useProfileForm() {
  const userStore = useUserStore();
  const toast = useToast();

  // Form fields
  const firstName = ref('');
  const lastName = ref('');
  const email = ref('');
  const password = ref('');
  const passwordConfirmation = ref('');
  const currentPassword = ref('');

  // Form state
  const isSubmitting = ref(false);

  // Error messages
  const errors = ref<ProfileFormErrors>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    currentPassword: '',
    general: '',
  });

  // Computed properties
  const hasPasswordFields = computed(() => {
    return !!(password.value || passwordConfirmation.value || currentPassword.value);
  });

  const isFormValid = computed(() => {
    return (
      firstName.value.trim() !== '' &&
      lastName.value.trim() !== '' &&
      email.value.trim() !== '' &&
      (!hasPasswordFields.value ||
        (currentPassword.value &&
          password.value &&
          password.value === passwordConfirmation.value &&
          password.value.length >= 8))
    );
  });

  /**
   * Initialize form with user data
   */
  const initializeForm = (): void => {
    if (userStore.user) {
      firstName.value = userStore.user.first_name;
      lastName.value = userStore.user.last_name;
      email.value = userStore.user.email;
    }
    clearPasswordFields();
    clearErrors();
  };

  /**
   * Clear all password fields
   */
  const clearPasswordFields = (): void => {
    password.value = '';
    passwordConfirmation.value = '';
    currentPassword.value = '';
  };

  /**
   * Clear all error messages
   */
  const clearErrors = (): void => {
    errors.value = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      currentPassword: '',
      general: '',
    };
  };

  /**
   * Validate form fields
   * @returns true if valid, false otherwise
   */
  const validateForm = (): boolean => {
    clearErrors();

    let isValid = true;

    // Validate first name
    if (!firstName.value.trim()) {
      errors.value.firstName = 'First name is required';
      isValid = false;
    }

    // Validate last name
    if (!lastName.value.trim()) {
      errors.value.lastName = 'Last name is required';
      isValid = false;
    }

    // Validate email
    if (!email.value.trim()) {
      errors.value.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      errors.value.email = 'Please enter a valid email address';
      isValid = false;
    }

    // If any password field is filled, validate all password fields
    if (hasPasswordFields.value) {
      if (!currentPassword.value) {
        errors.value.currentPassword = 'Current password is required to change password';
        isValid = false;
      }
      if (!password.value) {
        errors.value.password = 'New password is required';
        isValid = false;
      } else if (password.value.length < 8) {
        errors.value.password = 'Password must be at least 8 characters';
        isValid = false;
      } else if (password.value !== passwordConfirmation.value) {
        errors.value.password = 'Passwords do not match';
        isValid = false;
      }
    }

    return isValid;
  };

  /**
   * Handle form submission
   * @returns Promise<boolean> - true if successful, false otherwise
   */
  const submitForm = async (): Promise<boolean> => {
    if (!validateForm()) {
      return false;
    }

    isSubmitting.value = true;

    try {
      const updateData: ProfileFormData = {
        first_name: firstName.value,
        last_name: lastName.value,
        email: email.value,
      };

      if (password.value) {
        updateData.password = password.value;
        updateData.password_confirmation = passwordConfirmation.value;
        updateData.current_password = currentPassword.value;
      }

      await userStore.updateProfile(updateData);

      // Clear password fields after successful update
      clearPasswordFields();

      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Profile updated successfully',
        life: 3000,
      });

      return true;
    } catch (error: unknown) {
      if (isAxiosError(error) && hasValidationErrors(error)) {
        const validationErrors = error.response?.data?.errors;
        if (validationErrors?.first_name?.[0]) {
          errors.value.firstName = validationErrors.first_name[0];
        }
        if (validationErrors?.last_name?.[0]) {
          errors.value.lastName = validationErrors.last_name[0];
        }
        if (validationErrors?.email?.[0]) {
          errors.value.email = validationErrors.email[0];
        }
        if (validationErrors?.password?.[0]) {
          errors.value.password = validationErrors.password[0];
        }
        if (validationErrors?.current_password?.[0]) {
          errors.value.currentPassword = validationErrors.current_password[0];
        }
        errors.value.general = error.response?.data?.message || 'Failed to update profile';
      } else {
        errors.value.general = 'Failed to update profile. Please try again.';
      }
      return false;
    } finally {
      isSubmitting.value = false;
    }
  };

  /**
   * Reset form to initial state
   */
  const resetForm = (): void => {
    initializeForm();
  };

  return {
    // Form fields
    firstName,
    lastName,
    email,
    password,
    passwordConfirmation,
    currentPassword,

    // Form state
    isSubmitting,
    errors,

    // Computed
    hasPasswordFields,
    isFormValid,

    // Methods
    initializeForm,
    clearPasswordFields,
    clearErrors,
    validateForm,
    submitForm,
    resetForm,
  };
}
