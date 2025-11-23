import { apiClient, apiService } from './api';
import type { User } from '@app/types/user';
import type { LoginCredentials } from '@app/types/auth';
import { API_ENDPOINTS } from '@app/constants/apiEndpoints';

class AuthService {
  async login(credentials: LoginCredentials, signal?: AbortSignal): Promise<User> {
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

  async logout(signal?: AbortSignal): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.auth.logout(), {}, { signal });
    } catch (error) {
      // Always clear local state even if API call fails
      console.error('Logout API error:', error);
    }
  }

  async checkAuth(signal?: AbortSignal): Promise<User | null> {
    try {
      const response = await apiClient.get<{ data: { user: User } }>(API_ENDPOINTS.auth.me(), {
        signal,
      });
      return response.data.data.user;
    } catch {
      return null;
    }
  }

  async resendVerificationEmail(signal?: AbortSignal): Promise<void> {
    await apiClient.post(API_ENDPOINTS.auth.resendVerificationEmail(), {}, { signal });
  }

  async updateProfile(
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

  async impersonate(token: string, signal?: AbortSignal): Promise<User> {
    await apiService.fetchCSRFToken();

    const response = await apiClient.post<{ data: { user: User } }>(
      API_ENDPOINTS.auth.impersonate(),
      { token },
      { signal },
    );

    return response.data.data.user;
  }
}

export const authService = new AuthService();
