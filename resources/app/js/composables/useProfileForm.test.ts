import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useProfileForm } from './useProfileForm';
import { useUserStore } from '@app/stores/userStore';
import type { User } from '@app/types/user';
import { AxiosError } from 'axios';

// Mock PrimeVue toast
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn(),
  }),
}));

describe('useProfileForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with empty fields', () => {
      const { firstName, lastName, email, password, passwordConfirmation, currentPassword } =
        useProfileForm();

      expect(firstName.value).toBe('');
      expect(lastName.value).toBe('');
      expect(email.value).toBe('');
      expect(password.value).toBe('');
      expect(passwordConfirmation.value).toBe('');
      expect(currentPassword.value).toBe('');
    });

    it('should initialize with no errors', () => {
      const { errors } = useProfileForm();

      expect(errors.value.firstName).toBe('');
      expect(errors.value.lastName).toBe('');
      expect(errors.value.email).toBe('');
      expect(errors.value.password).toBe('');
      expect(errors.value.currentPassword).toBe('');
      expect(errors.value.general).toBe('');
    });

    it('should initialize with isSubmitting false', () => {
      const { isSubmitting } = useProfileForm();

      expect(isSubmitting.value).toBe(false);
    });
  });

  describe('initializeForm', () => {
    it('should populate form with user data from store', () => {
      const userStore = useUserStore();
      const mockUser: User = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        email_verified_at: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };
      userStore.user = mockUser;

      const { firstName, lastName, email, initializeForm } = useProfileForm();

      initializeForm();

      expect(firstName.value).toBe('John');
      expect(lastName.value).toBe('Doe');
      expect(email.value).toBe('john@example.com');
    });

    it('should clear password fields when initializing', () => {
      const userStore = useUserStore();
      const mockUser: User = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        email_verified_at: null,
      };
      userStore.user = mockUser;

      const { password, passwordConfirmation, currentPassword, initializeForm } = useProfileForm();

      // Set some password values
      password.value = 'test123';
      passwordConfirmation.value = 'test123';
      currentPassword.value = 'old123';

      initializeForm();

      expect(password.value).toBe('');
      expect(passwordConfirmation.value).toBe('');
      expect(currentPassword.value).toBe('');
    });

    it('should clear errors when initializing', () => {
      const userStore = useUserStore();
      const mockUser: User = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        email_verified_at: null,
      };
      userStore.user = mockUser;

      const { errors, initializeForm } = useProfileForm();

      // Set some errors
      errors.value.firstName = 'Error';
      errors.value.email = 'Invalid email';

      initializeForm();

      expect(errors.value.firstName).toBe('');
      expect(errors.value.email).toBe('');
    });

    it('should handle null user gracefully', () => {
      const userStore = useUserStore();
      userStore.user = null;

      const { firstName, lastName, email, initializeForm } = useProfileForm();

      initializeForm();

      expect(firstName.value).toBe('');
      expect(lastName.value).toBe('');
      expect(email.value).toBe('');
    });
  });

  describe('clearPasswordFields', () => {
    it('should clear all password fields', () => {
      const { password, passwordConfirmation, currentPassword, clearPasswordFields } =
        useProfileForm();

      password.value = 'password123';
      passwordConfirmation.value = 'password123';
      currentPassword.value = 'oldpassword';

      clearPasswordFields();

      expect(password.value).toBe('');
      expect(passwordConfirmation.value).toBe('');
      expect(currentPassword.value).toBe('');
    });
  });

  describe('clearErrors', () => {
    it('should clear all error messages', () => {
      const { errors, clearErrors } = useProfileForm();

      errors.value.firstName = 'First name error';
      errors.value.lastName = 'Last name error';
      errors.value.email = 'Email error';
      errors.value.password = 'Password error';
      errors.value.currentPassword = 'Current password error';
      errors.value.general = 'General error';

      clearErrors();

      expect(errors.value.firstName).toBe('');
      expect(errors.value.lastName).toBe('');
      expect(errors.value.email).toBe('');
      expect(errors.value.password).toBe('');
      expect(errors.value.currentPassword).toBe('');
      expect(errors.value.general).toBe('');
    });
  });

  describe('hasPasswordFields computed property', () => {
    it('should return false when no password fields are filled', () => {
      const { hasPasswordFields } = useProfileForm();

      expect(hasPasswordFields.value).toBe(false);
    });

    it('should return true when password field is filled', () => {
      const { password, hasPasswordFields } = useProfileForm();

      password.value = 'newpassword123';

      expect(hasPasswordFields.value).toBe(true);
    });

    it('should return true when password confirmation field is filled', () => {
      const { passwordConfirmation, hasPasswordFields } = useProfileForm();

      passwordConfirmation.value = 'newpassword123';

      expect(hasPasswordFields.value).toBe(true);
    });

    it('should return true when current password field is filled', () => {
      const { currentPassword, hasPasswordFields } = useProfileForm();

      currentPassword.value = 'oldpassword';

      expect(hasPasswordFields.value).toBe(true);
    });

    it('should return true when any password field is filled', () => {
      const { password, currentPassword, hasPasswordFields } = useProfileForm();

      password.value = 'new';
      currentPassword.value = 'old';

      expect(hasPasswordFields.value).toBe(true);
    });
  });

  describe('isFormValid computed property', () => {
    it('should return false when first name is empty', () => {
      const { firstName, lastName, email, isFormValid } = useProfileForm();

      firstName.value = '';
      lastName.value = 'Doe';
      email.value = 'john@example.com';

      expect(isFormValid.value).toBe(false);
    });

    it('should return false when last name is empty', () => {
      const { firstName, lastName, email, isFormValid } = useProfileForm();

      firstName.value = 'John';
      lastName.value = '';
      email.value = 'john@example.com';

      expect(isFormValid.value).toBe(false);
    });

    it('should return false when email is empty', () => {
      const { firstName, lastName, email, isFormValid } = useProfileForm();

      firstName.value = 'John';
      lastName.value = 'Doe';
      email.value = '';

      expect(isFormValid.value).toBe(false);
    });

    it('should return true when basic fields are filled and no password fields', () => {
      const { firstName, lastName, email, isFormValid } = useProfileForm();

      firstName.value = 'John';
      lastName.value = 'Doe';
      email.value = 'john@example.com';

      expect(isFormValid.value).toBe(true);
    });

    it('should return false when password fields are filled but current password is missing', () => {
      const { firstName, lastName, email, password, passwordConfirmation, isFormValid } =
        useProfileForm();

      firstName.value = 'John';
      lastName.value = 'Doe';
      email.value = 'john@example.com';
      password.value = 'newpassword123';
      passwordConfirmation.value = 'newpassword123';

      expect(isFormValid.value).toBeFalsy();
    });

    it('should return false when password fields are filled but password is missing', () => {
      const { firstName, lastName, email, currentPassword, isFormValid } = useProfileForm();

      firstName.value = 'John';
      lastName.value = 'Doe';
      email.value = 'john@example.com';
      currentPassword.value = 'oldpassword';

      expect(isFormValid.value).toBeFalsy();
    });

    it('should return false when passwords do not match', () => {
      const {
        firstName,
        lastName,
        email,
        password,
        passwordConfirmation,
        currentPassword,
        isFormValid,
      } = useProfileForm();

      firstName.value = 'John';
      lastName.value = 'Doe';
      email.value = 'john@example.com';
      password.value = 'newpassword123';
      passwordConfirmation.value = 'differentpassword';
      currentPassword.value = 'oldpassword';

      expect(isFormValid.value).toBe(false);
    });

    it('should return false when password is too short', () => {
      const {
        firstName,
        lastName,
        email,
        password,
        passwordConfirmation,
        currentPassword,
        isFormValid,
      } = useProfileForm();

      firstName.value = 'John';
      lastName.value = 'Doe';
      email.value = 'john@example.com';
      password.value = 'short';
      passwordConfirmation.value = 'short';
      currentPassword.value = 'oldpassword';

      expect(isFormValid.value).toBe(false);
    });

    it('should return true when all fields are valid including password fields', () => {
      const {
        firstName,
        lastName,
        email,
        password,
        passwordConfirmation,
        currentPassword,
        isFormValid,
      } = useProfileForm();

      firstName.value = 'John';
      lastName.value = 'Doe';
      email.value = 'john@example.com';
      password.value = 'newpassword123';
      passwordConfirmation.value = 'newpassword123';
      currentPassword.value = 'oldpassword';

      expect(isFormValid.value).toBe(true);
    });
  });

  describe('validateForm', () => {
    it('should return false and set error when first name is empty', () => {
      const { firstName, lastName, email, validateForm, errors } = useProfileForm();

      firstName.value = '';
      lastName.value = 'Doe';
      email.value = 'john@example.com';

      const isValid = validateForm();

      expect(isValid).toBe(false);
      expect(errors.value.firstName).toBe('First name is required');
    });

    it('should return false and set error when first name is whitespace', () => {
      const { firstName, lastName, email, validateForm, errors } = useProfileForm();

      firstName.value = '   ';
      lastName.value = 'Doe';
      email.value = 'john@example.com';

      const isValid = validateForm();

      expect(isValid).toBe(false);
      expect(errors.value.firstName).toBe('First name is required');
    });

    it('should return false and set error when last name is empty', () => {
      const { firstName, lastName, email, validateForm, errors } = useProfileForm();

      firstName.value = 'John';
      lastName.value = '';
      email.value = 'john@example.com';

      const isValid = validateForm();

      expect(isValid).toBe(false);
      expect(errors.value.lastName).toBe('Last name is required');
    });

    it('should return false and set error when email is empty', () => {
      const { firstName, lastName, email, validateForm, errors } = useProfileForm();

      firstName.value = 'John';
      lastName.value = 'Doe';
      email.value = '';

      const isValid = validateForm();

      expect(isValid).toBe(false);
      expect(errors.value.email).toBe('Email is required');
    });

    it('should return false and set error when email format is invalid', () => {
      const { firstName, lastName, email, validateForm, errors } = useProfileForm();

      firstName.value = 'John';
      lastName.value = 'Doe';
      email.value = 'invalid-email';

      const isValid = validateForm();

      expect(isValid).toBe(false);
      expect(errors.value.email).toBe('Please enter a valid email address');
    });

    it('should return false when current password is missing but new password is provided', () => {
      const { firstName, lastName, email, password, validateForm, errors } = useProfileForm();

      firstName.value = 'John';
      lastName.value = 'Doe';
      email.value = 'john@example.com';
      password.value = 'newpassword123';

      const isValid = validateForm();

      expect(isValid).toBe(false);
      expect(errors.value.currentPassword).toBe('Current password is required to change password');
    });

    it('should return false when new password is missing but current password is provided', () => {
      const { firstName, lastName, email, currentPassword, validateForm, errors } =
        useProfileForm();

      firstName.value = 'John';
      lastName.value = 'Doe';
      email.value = 'john@example.com';
      currentPassword.value = 'oldpassword';

      const isValid = validateForm();

      expect(isValid).toBe(false);
      expect(errors.value.password).toBe('New password is required');
    });

    it('should return false when new password is too short', () => {
      const {
        firstName,
        lastName,
        email,
        password,
        passwordConfirmation,
        currentPassword,
        validateForm,
        errors,
      } = useProfileForm();

      firstName.value = 'John';
      lastName.value = 'Doe';
      email.value = 'john@example.com';
      password.value = 'short';
      passwordConfirmation.value = 'short';
      currentPassword.value = 'oldpassword';

      const isValid = validateForm();

      expect(isValid).toBe(false);
      expect(errors.value.password).toBe('Password must be at least 8 characters');
    });

    it('should return false when passwords do not match', () => {
      const {
        firstName,
        lastName,
        email,
        password,
        passwordConfirmation,
        currentPassword,
        validateForm,
        errors,
      } = useProfileForm();

      firstName.value = 'John';
      lastName.value = 'Doe';
      email.value = 'john@example.com';
      password.value = 'newpassword123';
      passwordConfirmation.value = 'differentpassword';
      currentPassword.value = 'oldpassword';

      const isValid = validateForm();

      expect(isValid).toBe(false);
      expect(errors.value.password).toBe('Passwords do not match');
    });

    it('should return true when all fields are valid without password change', () => {
      const { firstName, lastName, email, validateForm } = useProfileForm();

      firstName.value = 'John';
      lastName.value = 'Doe';
      email.value = 'john@example.com';

      const isValid = validateForm();

      expect(isValid).toBe(true);
    });

    it('should return true when all fields are valid with password change', () => {
      const {
        firstName,
        lastName,
        email,
        password,
        passwordConfirmation,
        currentPassword,
        validateForm,
      } = useProfileForm();

      firstName.value = 'John';
      lastName.value = 'Doe';
      email.value = 'john@example.com';
      password.value = 'newpassword123';
      passwordConfirmation.value = 'newpassword123';
      currentPassword.value = 'oldpassword';

      const isValid = validateForm();

      expect(isValid).toBe(true);
    });

    it('should clear previous errors before validating', () => {
      const { firstName, lastName, email, validateForm, errors } = useProfileForm();

      // First validation with errors
      firstName.value = '';
      validateForm();
      expect(errors.value.firstName).toBe('First name is required');

      // Second validation should clear previous errors
      firstName.value = 'John';
      lastName.value = 'Doe';
      email.value = 'john@example.com';
      validateForm();

      expect(errors.value.firstName).toBe('');
    });
  });

  describe('submitForm', () => {
    it('should return false without calling API if validation fails', async () => {
      const userStore = useUserStore();
      const updateProfileSpy = vi.spyOn(userStore, 'updateProfile');

      const { firstName, lastName, email, submitForm } = useProfileForm();

      firstName.value = '';
      lastName.value = 'Doe';
      email.value = 'john@example.com';

      const result = await submitForm();

      expect(result).toBe(false);
      expect(updateProfileSpy).not.toHaveBeenCalled();
    });

    it('should call updateProfile with basic data when no password change', async () => {
      const userStore = useUserStore();
      const updateProfileSpy = vi.spyOn(userStore, 'updateProfile').mockResolvedValue(undefined);

      const { firstName, lastName, email, submitForm } = useProfileForm();

      firstName.value = 'John';
      lastName.value = 'Doe';
      email.value = 'john@example.com';

      await submitForm();

      expect(updateProfileSpy).toHaveBeenCalledWith({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      });
    });

    it('should call updateProfile with password data when password is changed', async () => {
      const userStore = useUserStore();
      const updateProfileSpy = vi.spyOn(userStore, 'updateProfile').mockResolvedValue(undefined);

      const {
        firstName,
        lastName,
        email,
        password,
        passwordConfirmation,
        currentPassword,
        submitForm,
      } = useProfileForm();

      firstName.value = 'John';
      lastName.value = 'Doe';
      email.value = 'john@example.com';
      password.value = 'newpassword123';
      passwordConfirmation.value = 'newpassword123';
      currentPassword.value = 'oldpassword';

      await submitForm();

      expect(updateProfileSpy).toHaveBeenCalledWith({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password: 'newpassword123',
        password_confirmation: 'newpassword123',
        current_password: 'oldpassword',
      });
    });

    it('should return true on successful update', async () => {
      const userStore = useUserStore();
      vi.spyOn(userStore, 'updateProfile').mockResolvedValue(undefined);

      const { firstName, lastName, email, submitForm } = useProfileForm();

      firstName.value = 'John';
      lastName.value = 'Doe';
      email.value = 'john@example.com';

      const result = await submitForm();

      expect(result).toBe(true);
    });

    it('should clear password fields after successful update', async () => {
      const userStore = useUserStore();
      vi.spyOn(userStore, 'updateProfile').mockResolvedValue(undefined);

      const {
        firstName,
        lastName,
        email,
        password,
        passwordConfirmation,
        currentPassword,
        submitForm,
      } = useProfileForm();

      firstName.value = 'John';
      lastName.value = 'Doe';
      email.value = 'john@example.com';
      password.value = 'newpassword123';
      passwordConfirmation.value = 'newpassword123';
      currentPassword.value = 'oldpassword';

      await submitForm();

      expect(password.value).toBe('');
      expect(passwordConfirmation.value).toBe('');
      expect(currentPassword.value).toBe('');
    });

    it('should set isSubmitting to true during submission', async () => {
      const userStore = useUserStore();
      let isSubmittingDuringCall = false;

      vi.spyOn(userStore, 'updateProfile').mockImplementation(async () => {
        isSubmittingDuringCall = isSubmitting.value;
        return undefined;
      });

      const { firstName, lastName, email, isSubmitting, submitForm } = useProfileForm();

      firstName.value = 'John';
      lastName.value = 'Doe';
      email.value = 'john@example.com';

      await submitForm();

      expect(isSubmittingDuringCall).toBe(true);
      expect(isSubmitting.value).toBe(false);
    });

    it('should handle validation errors from backend', async () => {
      const userStore = useUserStore();
      const validationError = new AxiosError(
        'Validation error',
        '422',
        undefined,
        {},
        {
          status: 422,
          statusText: 'Unprocessable Entity',
          data: {
            message: 'The given data was invalid.',
            errors: {
              first_name: ['The first name field is required.'],
              email: ['The email has already been taken.'],
              password: ['The password must be at least 8 characters.'],
              current_password: ['The current password is incorrect.'],
            },
          },
          headers: {},
          config: {} as any,
        },
      );
      Object.defineProperty(validationError, 'isAxiosError', {
        value: true,
        writable: false,
      });

      vi.spyOn(userStore, 'updateProfile').mockRejectedValue(validationError);

      const { firstName, lastName, email, submitForm, errors } = useProfileForm();

      firstName.value = 'John';
      lastName.value = 'Doe';
      email.value = 'john@example.com';

      const result = await submitForm();

      expect(result).toBe(false);
      expect(errors.value.firstName).toBe('The first name field is required.');
      expect(errors.value.email).toBe('The email has already been taken.');
      expect(errors.value.password).toBe('The password must be at least 8 characters.');
      expect(errors.value.currentPassword).toBe('The current password is incorrect.');
      expect(errors.value.general).toBe('The given data was invalid.');
    });

    it('should handle network errors gracefully', async () => {
      const userStore = useUserStore();
      const networkError = new Error('Network error');

      vi.spyOn(userStore, 'updateProfile').mockRejectedValue(networkError);

      const { firstName, lastName, email, submitForm, errors } = useProfileForm();

      firstName.value = 'John';
      lastName.value = 'Doe';
      email.value = 'john@example.com';

      const result = await submitForm();

      expect(result).toBe(false);
      expect(errors.value.general).toBe('Failed to update profile. Please try again.');
    });

    it('should set isSubmitting to false even when error occurs', async () => {
      const userStore = useUserStore();
      vi.spyOn(userStore, 'updateProfile').mockRejectedValue(new Error('Error'));

      const { firstName, lastName, email, isSubmitting, submitForm } = useProfileForm();

      firstName.value = 'John';
      lastName.value = 'Doe';
      email.value = 'john@example.com';

      await submitForm();

      expect(isSubmitting.value).toBe(false);
    });
  });

  describe('resetForm', () => {
    it('should call initializeForm', () => {
      const userStore = useUserStore();
      const mockUser: User = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        email_verified_at: null,
      };
      userStore.user = mockUser;

      const { firstName, lastName, email, password, resetForm } = useProfileForm();

      // Change some values
      firstName.value = 'Jane';
      lastName.value = 'Smith';
      email.value = 'jane@example.com';
      password.value = 'password123';

      resetForm();

      expect(firstName.value).toBe('John');
      expect(lastName.value).toBe('Doe');
      expect(email.value).toBe('john@example.com');
      expect(password.value).toBe('');
    });
  });
});
