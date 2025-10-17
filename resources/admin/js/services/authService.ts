import { apiService } from './api';
import type {
  Admin,
  LoginCredentials,
  LoginResponse,
  AuthCheckResponse,
  LogoutResponse,
} from '@admin/types/admin';
import { logger } from '@admin/utils/logger';
import { handleServiceError } from '@admin/utils/errorHandler';
import { isAxiosError, hasValidationErrors } from '@admin/types/errors';

/**
 * Authentication Service
 * Handles login, logout, and session management
 */
class AuthService {
  private readonly REMEMBER_KEY = 'admin_remember';

  /**
   * Login with credentials
   * @param credentials - User login credentials
   * @param signal - Optional AbortSignal for request cancellation
   */
  async login(credentials: LoginCredentials, signal?: AbortSignal): Promise<Admin> {
    try {
      // First, get CSRF cookie
      await apiService.get('/csrf-cookie', { signal });

      // Then attempt login
      const response = await apiService.post<LoginResponse>('/login', credentials, { signal });

      if (!response.success || !response.data?.admin) {
        throw new Error(response.message || 'Login failed');
      }

      // Store remember preference
      if (credentials.remember) {
        this.setRememberMe(true);
      } else {
        this.clearRememberMe();
      }

      return response.data.admin;
    } catch (error) {
      // For login, we want to preserve validation errors for better UX
      // Don't transform validation errors to ApplicationError
      if (isAxiosError(error) && hasValidationErrors(error)) {
        throw error; // Keep original error for login view to handle
      }
      handleServiceError(error);
    }
  }

  /**
   * Logout the current admin
   * @param signal - Optional AbortSignal for request cancellation
   */
  async logout(signal?: AbortSignal): Promise<void> {
    try {
      await apiService.post<LogoutResponse>('/logout', {}, { signal });
    } catch (error) {
      logger.error('Logout error:', error);
    } finally {
      // Always clear local data even if API call fails
      this.clearRememberMe();
    }
  }

  /**
   * Check if the user is authenticated and get admin data
   * @param signal - Optional AbortSignal for request cancellation
   */
  async checkAuth(signal?: AbortSignal): Promise<Admin | null> {
    try {
      const response = await apiService.get<AuthCheckResponse>('/auth/check', { signal });

      if (response.data?.authenticated && response.data?.admin) {
        return response.data.admin;
      }

      return null;
    } catch (error) {
      logger.error('Auth check error:', error);
      return null;
    }
  }

  /**
   * Get current admin from session
   * @param signal - Optional AbortSignal for request cancellation
   */
  async getCurrentAdmin(signal?: AbortSignal): Promise<Admin | null> {
    try {
      const response = await apiService.get<{ success: boolean; data: { admin: Admin } }>(
        '/auth/me',
        { signal }
      );
      return response.data?.admin || null;
    } catch {
      return null;
    }
  }

  /**
   * Check if remember me is enabled
   */
  hasRememberMe(): boolean {
    return localStorage.getItem(this.REMEMBER_KEY) === 'true';
  }

  /**
   * Set remember me preference
   */
  private setRememberMe(value: boolean): void {
    if (value) {
      localStorage.setItem(this.REMEMBER_KEY, 'true');
    } else {
      this.clearRememberMe();
    }
  }

  /**
   * Clear remember me preference
   */
  private clearRememberMe(): void {
    localStorage.removeItem(this.REMEMBER_KEY);
  }

  /**
   * Check if session is likely expired based on local state
   */
  isSessionLikelyExpired(): boolean {
    // If remember me was not set, session may have expired
    return !this.hasRememberMe();
  }
}

// Export a singleton instance
export const authService = new AuthService();
export default authService;
