/**
 * FormData Building Utilities
 * Centralized utilities for building FormData objects with consistent patterns
 */

/**
 * Append a value to FormData if it's not undefined
 * Handles null by converting to empty string
 *
 * @param formData - FormData instance
 * @param key - Field key
 * @param value - Value to append (string, number, boolean, File, or null/undefined)
 */
export function appendIfDefined(
  formData: FormData,
  key: string,
  value: string | number | boolean | File | null | undefined,
): void {
  if (value === undefined) {
    return;
  }

  if (value === null) {
    formData.append(key, '');
    return;
  }

  if (typeof value === 'boolean') {
    formData.append(key, value ? '1' : '0');
    return;
  }

  if (typeof value === 'number') {
    formData.append(key, value.toString());
    return;
  }

  formData.append(key, value);
}

/**
 * Append a file to FormData if it's a File object
 * Ignores null/undefined values
 *
 * @param formData - FormData instance
 * @param key - Field key
 * @param file - File object or null/undefined
 */
export function appendFileIfProvided(
  formData: FormData,
  key: string,
  file: File | null | undefined,
): void {
  if (file instanceof File) {
    formData.append(key, file);
  }
}

/**
 * Add Laravel method spoofing for PUT/PATCH requests with FormData
 *
 * @param formData - FormData instance
 * @param method - HTTP method ('PUT' or 'PATCH')
 */
export function addMethodSpoofing(formData: FormData, method: 'PUT' | 'PATCH' = 'PUT'): void {
  formData.append('_method', method);
}

/**
 * Build FormData from a plain object
 * Automatically handles strings, numbers, booleans, Files, and null/undefined
 *
 * @param data - Object with key-value pairs
 * @returns FormData instance
 */
export function buildFormData(data: Record<string, unknown>): FormData {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value instanceof File) {
      appendFileIfProvided(formData, key, value);
    } else if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      appendIfDefined(formData, key, value);
    }
    // Ignore undefined and other types
  });

  return formData;
}
