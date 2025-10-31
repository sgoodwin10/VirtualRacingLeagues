import { AxiosError } from 'axios';

export interface ValidationErrors {
  [key: string]: string[];
}

export interface ApiErrorResponse {
  message: string;
  errors?: ValidationErrors;
}

export function isAxiosError(error: unknown): error is AxiosError<ApiErrorResponse> {
  return (error as AxiosError).isAxiosError === true;
}

export function hasValidationErrors(error: AxiosError<ApiErrorResponse>): boolean {
  return !!(error.response?.data?.errors && Object.keys(error.response.data.errors).length > 0);
}

export function getErrorMessage(error: unknown, defaultMessage: string): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message || defaultMessage;
  }

  if (error instanceof Error) {
    return error.message || defaultMessage;
  }

  return defaultMessage;
}
