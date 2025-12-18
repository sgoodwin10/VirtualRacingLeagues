/**
 * File Validation Utilities
 * Client-side validation for file uploads (size, type, etc.)
 */

export interface FileValidationOptions {
  maxSizeInMB?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Default validation options
 */
export const DEFAULT_FILE_VALIDATION: FileValidationOptions = {
  maxSizeInMB: 5,
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
};

/**
 * CSV file validation options
 */
export const CSV_FILE_VALIDATION: FileValidationOptions = {
  maxSizeInMB: 10,
  allowedTypes: ['text/csv', 'application/csv', 'text/plain'],
  allowedExtensions: ['.csv'],
};

/**
 * Image file validation options
 */
export const IMAGE_FILE_VALIDATION: FileValidationOptions = {
  maxSizeInMB: 5,
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
};

/**
 * Validate a file against the provided options
 *
 * @param file - File to validate
 * @param options - Validation options
 * @returns Validation result with error message if invalid
 */
export function validateFile(
  file: File,
  options: FileValidationOptions = DEFAULT_FILE_VALIDATION,
): FileValidationResult {
  const { maxSizeInMB = 5, allowedTypes, allowedExtensions } = options;

  // Check file size
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return {
      valid: false,
      error: `File size must not exceed ${maxSizeInMB}MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  // Check file type (MIME type)
  if (allowedTypes && allowedTypes.length > 0) {
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type '${file.type}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }
  }

  // Check file extension
  if (allowedExtensions && allowedExtensions.length > 0) {
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase() || ''}`;
    if (!allowedExtensions.includes(fileExtension)) {
      return {
        valid: false,
        error: `File extension '${fileExtension}' is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validate multiple files
 *
 * @param files - Files to validate
 * @param options - Validation options
 * @returns Validation result with error message if any file is invalid
 */
export function validateFiles(
  files: File[],
  options: FileValidationOptions = DEFAULT_FILE_VALIDATION,
): FileValidationResult {
  for (const file of files) {
    const result = validateFile(file, options);
    if (!result.valid) {
      return result;
    }
  }

  return { valid: true };
}

/**
 * Format bytes to human-readable file size
 *
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places
 * @returns Formatted file size string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
