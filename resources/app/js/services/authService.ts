/**
 * Auth API Service
 * Handles all HTTP requests related to authentication
 */

import { apiClient, apiService } from './api';
import type { User } from '@app/types/user';
import type { LoginCredentials } from '@app/types/auth';
import { API_ENDPOINTS } from '@app/constants/apiEndpoints';

/**
 * Login user with credentials
 * @param credentials - Login credentials (email/password)
 * @param signal - Optional AbortSignal for request cancellation
 */
export async function login(credentials: LoginCredentials, signal?: AbortSignal): Promise<User> {
  await apiService.fetchCSRFToken();

  const response = await apiClient.post<{ data: { user: User } }>(
    API_ENDPOINTS.auth.login(),
    credentials,
    {
      signal,
    },
  );

  return response.data.data.user;
}

/**
 * Logout current user
 * @param signal - Optional AbortSignal for request cancellation
 */
export async function logout(signal?: AbortSignal): Promise<void> {
  try {
    await apiClient.post(API_ENDPOINTS.auth.logout(), {}, { signal });
  } catch (error) {
    // Always clear local state even if API call fails
    // Error is logged by Sentry via axios interceptor
    if (import.meta.env.DEV) {
      console.error('Logout API error:', error);
    }
  }
}

/**
 * Check authentication status and get current user
 * @param signal - Optional AbortSignal for request cancellation
 */
export async function checkAuth(signal?: AbortSignal): Promise<User> {
  const response = await apiClient.get<{ data: { user: User } }>(API_ENDPOINTS.auth.me(), {
    signal,
  });
  return response.data.data.user;
}

/**
 * Resend email verification
 * @param signal - Optional AbortSignal for request cancellation
 */
export async function resendVerificationEmail(signal?: AbortSignal): Promise<void> {
  await apiClient.post(API_ENDPOINTS.auth.resendVerificationEmail(), {}, { signal });
}

/**
 * Update user profile
 * @param data - Profile update data
 * @param signal - Optional AbortSignal for request cancellation
 */
export async function updateProfile(
  data: {
    first_name: string;
    last_name: string;
    email: string;
    password?: string;
    password_confirmation?: string;
    current_password?: string;
  },
  signal?: AbortSignal,
): Promise<User> {
  const response = await apiClient.put<{ data: { user: User } }>(
    API_ENDPOINTS.auth.updateProfile(),
    data,
    { signal },
  );

  return response.data.data.user;
}

/**
 * Impersonate a user using a token
 * @param token - Impersonation token
 * @param signal - Optional AbortSignal for request cancellation
 */
export async function impersonate(token: string, signal?: AbortSignal): Promise<User> {
  await apiService.fetchCSRFToken();

  const response = await apiClient.post<{ data: { user: User } }>(
    API_ENDPOINTS.auth.impersonate(),
    { token },
    { signal },
  );

  return response.data.data.user;
}

/**
 * Grouped export for convenient importing
 */
export const authService = {
  login,
  logout,
  checkAuth,
  resendVerificationEmail,
  updateProfile,
  impersonate,
};
