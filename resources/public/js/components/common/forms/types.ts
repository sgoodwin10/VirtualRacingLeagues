/**
 * Shared TypeScript types for VRL Velocity Design System Forms
 */

/**
 * Option for select/dropdown components
 */
export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

/**
 * Input types supported by VrlInput component
 */
export type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'search'
  | 'date'
  | 'time'
  | 'datetime-local';

/**
 * Validation state for form fields
 */
export type ValidationState = 'valid' | 'invalid' | 'neutral';

/**
 * Form field size variants
 */
export type FormFieldSize = 'small' | 'medium' | 'large';
