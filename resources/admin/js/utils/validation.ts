/**
 * Form Validation Utilities
 * Provides reusable validation functions and helpers for forms
 */

/**
 * Email validation regex pattern
 * Matches standard email format: local@domain.tld
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email address format
 *
 * @param email - Email address to validate
 * @returns True if email is valid, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = isValidEmail('user@example.com'); // true
 * const isInvalid = isValidEmail('invalid-email'); // false
 * ```
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Validate required field (non-empty string)
 *
 * @param value - Value to validate
 * @returns True if value is present and not empty, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = isRequired('John'); // true
 * const isInvalid = isRequired('   '); // false
 * ```
 */
export function isRequired(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }
  return value.trim().length > 0;
}

/**
 * Validate minimum length
 *
 * @param value - Value to validate
 * @param minLength - Minimum required length
 * @returns True if value meets minimum length, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = minLength('password123', 8); // true
 * const isInvalid = minLength('pass', 8); // false
 * ```
 */
export function minLength(value: string, minLength: number): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }
  return value.trim().length >= minLength;
}

/**
 * Validate maximum length
 *
 * @param value - Value to validate
 * @param maxLength - Maximum allowed length
 * @returns True if value does not exceed maximum length, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = maxLength('John', 50); // true
 * const isInvalid = maxLength('Very long name...', 10); // false
 * ```
 */
export function maxLength(value: string, maxLength: number): boolean {
  if (!value || typeof value !== 'string') {
    return true; // Empty values pass max length check
  }
  return value.trim().length <= maxLength;
}

/**
 * Common validation error messages
 */
export const ValidationMessages = {
  REQUIRED: (fieldName: string) => `${fieldName} is required`,
  INVALID_EMAIL: 'Please enter a valid email address',
  MIN_LENGTH: (fieldName: string, min: number) => `${fieldName} must be at least ${min} characters`,
  MAX_LENGTH: (fieldName: string, max: number) => `${fieldName} must not exceed ${max} characters`,
} as const;

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate email field with proper error message
 *
 * @param email - Email to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```typescript
 * const result = validateEmail('user@example.com');
 * if (!result.isValid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateEmail(email: string): ValidationResult {
  if (!isRequired(email)) {
    return {
      isValid: false,
      error: ValidationMessages.REQUIRED('Email'),
    };
  }

  if (!isValidEmail(email)) {
    return {
      isValid: false,
      error: ValidationMessages.INVALID_EMAIL,
    };
  }

  return { isValid: true };
}

/**
 * Validate required field with proper error message
 *
 * @param value - Value to validate
 * @param fieldName - Name of the field for error message
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```typescript
 * const result = validateRequired('John', 'First name');
 * if (!result.isValid) {
 *   console.error(result.error); // "First name is required"
 * }
 * ```
 */
export function validateRequired(value: string, fieldName: string): ValidationResult {
  if (!isRequired(value)) {
    return {
      isValid: false,
      error: ValidationMessages.REQUIRED(fieldName),
    };
  }

  return { isValid: true };
}

/**
 * Validate field with min/max length constraints
 *
 * @param value - Value to validate
 * @param fieldName - Name of the field for error message
 * @param min - Minimum length (optional)
 * @param max - Maximum length (optional)
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```typescript
 * const result = validateLength('password', 'Password', 8, 50);
 * if (!result.isValid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateLength(
  value: string,
  fieldName: string,
  min?: number,
  max?: number,
): ValidationResult {
  if (min !== undefined && !minLength(value, min)) {
    return {
      isValid: false,
      error: ValidationMessages.MIN_LENGTH(fieldName, min),
    };
  }

  if (max !== undefined && !maxLength(value, max)) {
    return {
      isValid: false,
      error: ValidationMessages.MAX_LENGTH(fieldName, max),
    };
  }

  return { isValid: true };
}

/**
 * Composable validation function builder
 * Allows chaining multiple validators together
 *
 * @param validators - Array of validation functions
 * @returns Combined validation result
 *
 * @example
 * ```typescript
 * const validateName = compose([
 *   (value) => validateRequired(value, 'Name'),
 *   (value) => validateLength(value, 'Name', 2, 50)
 * ]);
 *
 * const result = validateName('Jo');
 * ```
 */
export function compose(
  validators: Array<(value: string) => ValidationResult>,
): (value: string) => ValidationResult {
  return (value: string): ValidationResult => {
    for (const validator of validators) {
      const result = validator(value);
      if (!result.isValid) {
        return result;
      }
    }
    return { isValid: true };
  };
}
