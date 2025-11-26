import { apiClient, apiService } from '@public/services/api';
import type { User } from '@public/types/user';
import type { LoginCredentials, RegisterData } from '@public/types/auth';

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
    } catch {
      return null;
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
