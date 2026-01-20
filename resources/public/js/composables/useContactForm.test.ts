import { describe, it, expect, beforeEach } from 'vitest';
import { reactive } from 'vue';
import { useContactForm, type ContactForm } from './useContactForm';

describe('useContactForm', () => {
  let form: ContactForm;

  beforeEach(() => {
    form = reactive({
      name: '',
      email: '',
      reason: '',
      message: '',
    });
  });

  describe('validateName', () => {
    it('should return true for valid name', () => {
      form.name = 'John Doe';
      const { validateName, errors } = useContactForm(form);

      expect(validateName()).toBe(true);
      expect(errors.name).toBe('');
    });

    it('should return false for empty name', () => {
      form.name = '';
      const { validateName, errors } = useContactForm(form);

      expect(validateName()).toBe(false);
      expect(errors.name).toBe('Name is required');
    });

    it('should return false for whitespace-only name', () => {
      form.name = '   ';
      const { validateName, errors } = useContactForm(form);

      expect(validateName()).toBe(false);
      expect(errors.name).toBe('Name is required');
    });
  });

  describe('validateEmail', () => {
    it('should return true for valid email', () => {
      form.email = 'test@example.com';
      const { validateEmail, errors } = useContactForm(form);

      expect(validateEmail()).toBe(true);
      expect(errors.email).toBe('');
    });

    it('should return false for empty email', () => {
      form.email = '';
      const { validateEmail, errors } = useContactForm(form);

      expect(validateEmail()).toBe(false);
      expect(errors.email).toBe('Email is required');
    });

    it('should return false for invalid email format', () => {
      form.email = 'invalid-email';
      const { validateEmail, errors } = useContactForm(form);

      expect(validateEmail()).toBe(false);
      expect(errors.email).toBe('Please enter a valid email address');
    });

    it('should return false for email without domain', () => {
      form.email = 'test@';
      const { validateEmail, errors } = useContactForm(form);

      expect(validateEmail()).toBe(false);
      expect(errors.email).toBe('Please enter a valid email address');
    });
  });

  describe('validateReason', () => {
    it('should return true for valid reason', () => {
      form.reason = 'error';
      const { validateReason, errors } = useContactForm(form);

      expect(validateReason()).toBe(true);
      expect(errors.reason).toBe('');
    });

    it('should return false for empty reason', () => {
      form.reason = '';
      const { validateReason, errors } = useContactForm(form);

      expect(validateReason()).toBe(false);
      expect(errors.reason).toBe('Please select a reason for contact');
    });
  });

  describe('validateMessage', () => {
    it('should return true for valid message', () => {
      form.message = 'This is a test message';
      const { validateMessage, errors } = useContactForm(form);

      expect(validateMessage()).toBe(true);
      expect(errors.message).toBe('');
    });

    it('should return false for empty message', () => {
      form.message = '';
      const { validateMessage, errors } = useContactForm(form);

      expect(validateMessage()).toBe(false);
      expect(errors.message).toBe('Message is required');
    });

    it('should return false for whitespace-only message', () => {
      form.message = '   ';
      const { validateMessage, errors } = useContactForm(form);

      expect(validateMessage()).toBe(false);
      expect(errors.message).toBe('Message is required');
    });

    it('should return false for message exceeding 2000 characters', () => {
      form.message = 'a'.repeat(2001);
      const { validateMessage, errors } = useContactForm(form);

      expect(validateMessage()).toBe(false);
      expect(errors.message).toBe('Message must be 2000 characters or less');
    });

    it('should return true for message with exactly 2000 characters', () => {
      form.message = 'a'.repeat(2000);
      const { validateMessage, errors } = useContactForm(form);

      expect(validateMessage()).toBe(true);
      expect(errors.message).toBe('');
    });
  });

  describe('validateAll', () => {
    it('should return true when all fields are valid', () => {
      form.name = 'John Doe';
      form.email = 'john@example.com';
      form.reason = 'question';
      form.message = 'This is a test message';
      const { validateAll, errors } = useContactForm(form);

      expect(validateAll()).toBe(true);
      expect(errors.name).toBe('');
      expect(errors.email).toBe('');
      expect(errors.reason).toBe('');
      expect(errors.message).toBe('');
    });

    it('should return false when name is invalid', () => {
      form.name = '';
      form.email = 'john@example.com';
      form.reason = 'question';
      form.message = 'This is a test message';
      const { validateAll, errors } = useContactForm(form);

      expect(validateAll()).toBe(false);
      expect(errors.name).toBe('Name is required');
    });

    it('should return false when email is invalid', () => {
      form.name = 'John Doe';
      form.email = 'invalid-email';
      form.reason = 'question';
      form.message = 'This is a test message';
      const { validateAll, errors } = useContactForm(form);

      expect(validateAll()).toBe(false);
      expect(errors.email).toBe('Please enter a valid email address');
    });

    it('should return false when multiple fields are invalid', () => {
      form.name = '';
      form.email = 'invalid-email';
      form.reason = '';
      form.message = '';
      const { validateAll, errors } = useContactForm(form);

      expect(validateAll()).toBe(false);
      expect(errors.name).toBe('Name is required');
      expect(errors.email).toBe('Please enter a valid email address');
      expect(errors.reason).toBe('Please select a reason for contact');
      expect(errors.message).toBe('Message is required');
    });
  });

  describe('clearError', () => {
    it('should clear a specific error', () => {
      form.name = '';
      const { validateAll, clearError, errors } = useContactForm(form);

      validateAll();
      expect(errors.name).toBe('Name is required');

      clearError('name');
      expect(errors.name).toBe('');
    });

    it('should not affect other errors', () => {
      form.name = '';
      form.email = '';
      const { validateAll, clearError, errors } = useContactForm(form);

      validateAll();
      expect(errors.name).toBe('Name is required');
      expect(errors.email).toBe('Email is required');

      clearError('name');
      expect(errors.name).toBe('');
      expect(errors.email).toBe('Email is required');
    });
  });

  describe('clearErrors', () => {
    it('should clear all errors', () => {
      form.name = '';
      form.email = '';
      form.reason = '';
      form.message = '';
      const { validateAll, clearErrors, errors } = useContactForm(form);

      validateAll();
      expect(errors.name).toBe('Name is required');
      expect(errors.email).toBe('Email is required');
      expect(errors.reason).toBe('Please select a reason for contact');
      expect(errors.message).toBe('Message is required');

      clearErrors();
      expect(errors.name).toBe('');
      expect(errors.email).toBe('');
      expect(errors.reason).toBe('');
      expect(errors.message).toBe('');
    });
  });

  describe('isValid computed property', () => {
    it('should return true when all fields are filled', () => {
      form.name = 'John Doe';
      form.email = 'john@example.com';
      form.reason = 'question';
      form.message = 'This is a test message';
      const { isValid } = useContactForm(form);

      expect(isValid.value).toBe(true);
    });

    it('should return false when name is empty', () => {
      form.name = '';
      form.email = 'john@example.com';
      form.reason = 'question';
      form.message = 'This is a test message';
      const { isValid } = useContactForm(form);

      expect(isValid.value).toBe(false);
    });

    it('should return false when message exceeds 2000 characters', () => {
      form.name = 'John Doe';
      form.email = 'john@example.com';
      form.reason = 'question';
      form.message = 'a'.repeat(2001);
      const { isValid } = useContactForm(form);

      expect(isValid.value).toBe(false);
    });

    it('should be reactive to form changes', () => {
      const { isValid } = useContactForm(form);

      expect(isValid.value).toBe(false);

      form.name = 'John Doe';
      form.email = 'john@example.com';
      form.reason = 'question';
      form.message = 'This is a test message';

      expect(isValid.value).toBe(true);
    });
  });

  describe('hasErrors computed property', () => {
    it('should return false when no errors exist', () => {
      const { hasErrors } = useContactForm(form);

      expect(hasErrors.value).toBe(false);
    });

    it('should return true when at least one error exists', () => {
      form.name = '';
      const { validateName, hasErrors } = useContactForm(form);

      validateName();
      expect(hasErrors.value).toBe(true);
    });

    it('should be reactive to error changes', () => {
      form.name = '';
      const { validateName, clearErrors, hasErrors } = useContactForm(form);

      expect(hasErrors.value).toBe(false);

      validateName();
      expect(hasErrors.value).toBe(true);

      clearErrors();
      expect(hasErrors.value).toBe(false);
    });
  });
});
