import { apiClient, apiService } from '@public/services/api';
import type { User } from '@public/types/user';
import type { LoginCredentials, RegisterData } from '@public/types/auth';
import { isAxiosError } from '@public/types/errors';

class AuthService {
  async register(data: RegisterData, signal?: AbortSignal): Promise<void> {
    await apiService.fetchCSRFToken();
    await apiClient.post('/register', data, { signal });
  }

  async login(credentials: LoginCredentials, signal?: AbortSignal): Promise<User> {
    await apiService.fetchCSRFToken();

    const response = await apiClient.post<{ data: { user: User } }>('/login', credentials, {
      signal,
    });

    return response.data.data.user;
  }

  async logout(signal?: AbortSignal): Promise<void> {
    try {
      await apiClient.post('/logout', {}, { signal });
    } catch (error) {
      // Always clear local state even if API call fails
      console.error('Logout API error:', error);
    }
  }

  async checkAuth(signal?: AbortSignal): Promise<User | null> {
    try {
      const response = await apiClient.get<{ data: { user: User } }>('/me', { signal });
      return response.data.data.user;
    } catch (error) {
      // Only treat 401 (unauthorized) and 404 (not found) as "not authenticated"
      if (isAxiosError(error)) {
        const status = error.response?.status;
        // 401 Unauthorized - expected when user is not authenticated
        // 404 Not Found - endpoint doesn't exist, treat as not authenticated
        if (status === 401 || status === 404) {
          return null;
        }
      }

      // For all other errors (network errors, 500s, etc.), propagate them
      // so callers can handle them appropriately
      throw error;
    }
  }

  async resendVerificationEmail(signal?: AbortSignal): Promise<void> {
    await apiClient.post('/email/resend', {}, { signal });
  }

  async requestPasswordReset(email: string, signal?: AbortSignal): Promise<void> {
    await apiService.fetchCSRFToken();
    await apiClient.post('/forgot-password', { email }, { signal });
  }

  async resetPassword(
    data: { email: string; token: string; password: string; password_confirmation: string },
    signal?: AbortSignal,
  ): Promise<void> {
    await apiService.fetchCSRFToken();
    await apiClient.post('/reset-password', data, { signal });
  }
}

export const authService = new AuthService();
