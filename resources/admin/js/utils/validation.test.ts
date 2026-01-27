import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isRequired,
  minLength,
  maxLength,
  validateEmail,
  validateRequired,
  validateLength,
  compose,
  ValidationMessages,
} from './validation';

describe('validation utilities', () => {
  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user@example.co.uk')).toBe(true);
      expect(isValidEmail('admin+test@domain.org')).toBe(true);
      expect(isValidEmail('user123@test-domain.com')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user @example.com')).toBe(false);
      expect(isValidEmail('user@example')).toBe(false);
    });

    it('should return false for empty or null values', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('   ')).toBe(false);
    });

    it('should handle emails with whitespace by trimming', () => {
      expect(isValidEmail('  user@example.com  ')).toBe(true);
    });
  });

  describe('isRequired', () => {
    it('should return true for non-empty strings', () => {
      expect(isRequired('test')).toBe(true);
      expect(isRequired('a')).toBe(true);
      expect(isRequired('  value  ')).toBe(true);
    });

    it('should return false for empty strings', () => {
      expect(isRequired('')).toBe(false);
      expect(isRequired('   ')).toBe(false);
      expect(isRequired('\t\n')).toBe(false);
    });
  });

  describe('minLength', () => {
    it('should return true when value meets minimum length', () => {
      expect(minLength('password', 8)).toBe(true);
      expect(minLength('password123', 8)).toBe(true);
      expect(minLength('test', 4)).toBe(true);
    });

    it('should return false when value is shorter than minimum', () => {
      expect(minLength('pass', 8)).toBe(false);
      expect(minLength('a', 2)).toBe(false);
    });

    it('should trim whitespace before checking length', () => {
      expect(minLength('  test  ', 4)).toBe(true);
      expect(minLength('  ab  ', 4)).toBe(false);
    });

    it('should return false for empty strings', () => {
      expect(minLength('', 1)).toBe(false);
      expect(minLength('   ', 1)).toBe(false);
    });
  });

  describe('maxLength', () => {
    it('should return true when value does not exceed maximum', () => {
      expect(maxLength('test', 10)).toBe(true);
      expect(maxLength('password', 8)).toBe(true);
    });

    it('should return false when value exceeds maximum', () => {
      expect(maxLength('very long text here', 10)).toBe(false);
      expect(maxLength('password123', 8)).toBe(false);
    });

    it('should trim whitespace before checking length', () => {
      expect(maxLength('  test  ', 4)).toBe(true);
      expect(maxLength('  too long  ', 5)).toBe(false);
    });

    it('should return true for empty strings', () => {
      expect(maxLength('', 5)).toBe(true);
      expect(maxLength('   ', 5)).toBe(true);
    });
  });

  describe('validateEmail', () => {
    it('should return valid result for correct email', () => {
      const result = validateEmail('user@example.com');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error for empty email', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ValidationMessages.REQUIRED('Email'));
    });

    it('should return error for invalid email format', () => {
      const result = validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ValidationMessages.INVALID_EMAIL);
    });

    it('should validate trimmed email', () => {
      const result = validateEmail('  user@example.com  ');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateRequired', () => {
    it('should return valid result for non-empty value', () => {
      const result = validateRequired('John', 'First name');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error for empty value', () => {
      const result = validateRequired('', 'Last name');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ValidationMessages.REQUIRED('Last name'));
    });

    it('should return error for whitespace-only value', () => {
      const result = validateRequired('   ', 'Username');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ValidationMessages.REQUIRED('Username'));
    });
  });

  describe('validateLength', () => {
    it('should return valid result when within bounds', () => {
      const result = validateLength('password123', 'Password', 8, 20);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error when below minimum', () => {
      const result = validateLength('pass', 'Password', 8);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ValidationMessages.MIN_LENGTH('Password', 8));
    });

    it('should return error when above maximum', () => {
      const result = validateLength('very long password here', 'Password', undefined, 10);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ValidationMessages.MAX_LENGTH('Password', 10));
    });

    it('should validate with only minimum constraint', () => {
      const result = validateLength('password123', 'Password', 8);
      expect(result.isValid).toBe(true);
    });

    it('should validate with only maximum constraint', () => {
      const result = validateLength('test', 'Name', undefined, 50);
      expect(result.isValid).toBe(true);
    });

    it('should validate with no constraints', () => {
      const result = validateLength('any value', 'Field');
      expect(result.isValid).toBe(true);
    });
  });

  describe('compose', () => {
    it('should compose multiple validators and return success when all pass', () => {
      const validateName = compose([
        (value) => validateRequired(value, 'Name'),
        (value) => validateLength(value, 'Name', 2, 50),
      ]);

      const result = validateName('John Doe');
      expect(result.isValid).toBe(true);
    });

    it('should return first error when validators fail', () => {
      const validateName = compose([
        (value) => validateRequired(value, 'Name'),
        (value) => validateLength(value, 'Name', 2, 50),
      ]);

      const result = validateName('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ValidationMessages.REQUIRED('Name'));
    });

    it('should stop at first failing validator', () => {
      const validateName = compose([
        (value) => validateRequired(value, 'Name'),
        (value) => validateLength(value, 'Name', 10, 50),
      ]);

      const result = validateName('Jo');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(ValidationMessages.MIN_LENGTH('Name', 10));
    });

    it('should work with complex validation chains', () => {
      const validatePassword = compose([
        (value) => validateRequired(value, 'Password'),
        (value) => validateLength(value, 'Password', 8, 100),
      ]);

      expect(validatePassword('').isValid).toBe(false);
      expect(validatePassword('pass').isValid).toBe(false);
      expect(validatePassword('password123').isValid).toBe(true);
    });
  });

  describe('ValidationMessages', () => {
    it('should generate correct required message', () => {
      expect(ValidationMessages.REQUIRED('Email')).toBe('Email is required');
      expect(ValidationMessages.REQUIRED('Password')).toBe('Password is required');
    });

    it('should have correct invalid email message', () => {
      expect(ValidationMessages.INVALID_EMAIL).toBe('Please enter a valid email address');
    });

    it('should generate correct min length message', () => {
      expect(ValidationMessages.MIN_LENGTH('Password', 8)).toBe(
        'Password must be at least 8 characters',
      );
    });

    it('should generate correct max length message', () => {
      expect(ValidationMessages.MAX_LENGTH('Name', 50)).toBe('Name must not exceed 50 characters');
    });
  });
});
