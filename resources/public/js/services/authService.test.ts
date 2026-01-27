import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as authService from './authService';
import { apiClient, apiService } from './api';
import { API_ENDPOINTS } from '@public/constants/apiEndpoints';
import type { User } from '@public/types/user';
import type { LoginCredentials } from '@public/types/auth';

// Mock dependencies
vi.mock('./api', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  },
  apiService: {
    fetchCSRFToken: vi.fn(),
  },
}));

describe('authService', () => {
  const mockUser: User = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    email_verified_at: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    const credentials: LoginCredentials = {
      email: 'john@example.com',
      password: 'password123',
    };

    it('should fetch CSRF token before login', async () => {
      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue(undefined);
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      await authService.login(credentials);

      expect(apiService.fetchCSRFToken).toHaveBeenCalledOnce();
    });

    it('should call login endpoint with credentials', async () => {
      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue(undefined);
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      await authService.login(credentials);

      expect(apiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.auth.login(), credentials, {
        signal: undefined,
      });
    });

    it('should return user data', async () => {
      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue(undefined);
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      const result = await authService.login(credentials);

      expect(result).toEqual(mockUser);
    });

    it('should handle AbortSignal', async () => {
      const abortController = new AbortController();
      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue(undefined);
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      await authService.login(credentials, abortController.signal);

      expect(apiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.auth.login(), credentials, {
        signal: abortController.signal,
      });
    });

    it('should propagate 422 validation errors', async () => {
      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue(undefined);
      const error = {
        response: {
          status: 422,
          data: { message: 'Invalid credentials' },
        },
      };
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(authService.login(credentials)).rejects.toEqual(error);
    });

    it('should propagate network errors', async () => {
      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue(undefined);
      const error = new Error('Network Error');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(authService.login(credentials)).rejects.toEqual(error);
    });
  });

  describe('logout', () => {
    it('should call logout endpoint', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({});

      await authService.logout();

      expect(apiClient.post).toHaveBeenCalledWith(
        API_ENDPOINTS.auth.logout(),
        {},
        { signal: undefined },
      );
    });

    it('should handle AbortSignal', async () => {
      const abortController = new AbortController();
      vi.mocked(apiClient.post).mockResolvedValue({});

      await authService.logout(abortController.signal);

      expect(apiClient.post).toHaveBeenCalledWith(
        API_ENDPOINTS.auth.logout(),
        {},
        { signal: abortController.signal },
      );
    });

    it('should not throw on API errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('API Error');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(authService.logout()).resolves.toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Logout API error:', error);

      consoleErrorSpy.mockRestore();
    });

    it('should not throw on network errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Network Error'));

      await expect(authService.logout()).resolves.toBeUndefined();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('checkAuth', () => {
    it('should call me endpoint', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      await authService.checkAuth();

      expect(apiClient.get).toHaveBeenCalledWith(API_ENDPOINTS.auth.me(), { signal: undefined });
    });

    it('should return user data', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      const result = await authService.checkAuth();

      expect(result).toEqual(mockUser);
    });

    it('should handle AbortSignal', async () => {
      const abortController = new AbortController();
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      await authService.checkAuth(abortController.signal);

      expect(apiClient.get).toHaveBeenCalledWith(API_ENDPOINTS.auth.me(), {
        signal: abortController.signal,
      });
    });

    it('should propagate 401 errors', async () => {
      const error = { response: { status: 401 } };
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(authService.checkAuth()).rejects.toEqual(error);
    });
  });

  describe('resendVerificationEmail', () => {
    it('should call resend endpoint', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({});

      await authService.resendVerificationEmail();

      expect(apiClient.post).toHaveBeenCalledWith(
        API_ENDPOINTS.auth.resendVerificationEmail(),
        {},
        { signal: undefined },
      );
    });

    it('should handle AbortSignal', async () => {
      const abortController = new AbortController();
      vi.mocked(apiClient.post).mockResolvedValue({});

      await authService.resendVerificationEmail(abortController.signal);

      expect(apiClient.post).toHaveBeenCalledWith(
        API_ENDPOINTS.auth.resendVerificationEmail(),
        {},
        { signal: abortController.signal },
      );
    });

    it('should propagate errors', async () => {
      const error = new Error('API Error');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(authService.resendVerificationEmail()).rejects.toEqual(error);
    });
  });

  describe('updateProfile', () => {
    const profileData = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
    };

    it('should call update profile endpoint', async () => {
      vi.mocked(apiClient.put).mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      await authService.updateProfile(profileData);

      expect(apiClient.put).toHaveBeenCalledWith(API_ENDPOINTS.auth.updateProfile(), profileData, {
        signal: undefined,
      });
    });

    it('should return updated user data', async () => {
      vi.mocked(apiClient.put).mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      const result = await authService.updateProfile(profileData);

      expect(result).toEqual(mockUser);
    });

    it('should handle password update', async () => {
      const dataWithPassword = {
        ...profileData,
        password: 'newpassword',
        password_confirmation: 'newpassword',
        current_password: 'oldpassword',
      };
      vi.mocked(apiClient.put).mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      await authService.updateProfile(dataWithPassword);

      expect(apiClient.put).toHaveBeenCalledWith(
        API_ENDPOINTS.auth.updateProfile(),
        dataWithPassword,
        { signal: undefined },
      );
    });

    it('should handle AbortSignal', async () => {
      const abortController = new AbortController();
      vi.mocked(apiClient.put).mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      await authService.updateProfile(profileData, abortController.signal);

      expect(apiClient.put).toHaveBeenCalledWith(API_ENDPOINTS.auth.updateProfile(), profileData, {
        signal: abortController.signal,
      });
    });

    it('should propagate validation errors', async () => {
      const error = {
        response: {
          status: 422,
          data: { errors: { email: ['Email already taken'] } },
        },
      };
      vi.mocked(apiClient.put).mockRejectedValue(error);

      await expect(authService.updateProfile(profileData)).rejects.toEqual(error);
    });
  });

  describe('impersonate', () => {
    const token = 'impersonate-token-123';

    it('should fetch CSRF token before impersonate', async () => {
      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue(undefined);
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      await authService.impersonate(token);

      expect(apiService.fetchCSRFToken).toHaveBeenCalledOnce();
    });

    it('should call impersonate endpoint with token', async () => {
      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue(undefined);
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      await authService.impersonate(token);

      expect(apiClient.post).toHaveBeenCalledWith(
        API_ENDPOINTS.auth.impersonate(),
        { token },
        { signal: undefined },
      );
    });

    it('should return user data', async () => {
      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue(undefined);
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      const result = await authService.impersonate(token);

      expect(result).toEqual(mockUser);
    });

    it('should handle AbortSignal', async () => {
      const abortController = new AbortController();
      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue(undefined);
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      await authService.impersonate(token, abortController.signal);

      expect(apiClient.post).toHaveBeenCalledWith(
        API_ENDPOINTS.auth.impersonate(),
        { token },
        { signal: abortController.signal },
      );
    });

    it('should handle invalid token', async () => {
      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue(undefined);
      const error = {
        response: {
          status: 422,
          data: { message: 'Invalid impersonation token' },
        },
      };
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(authService.impersonate(token)).rejects.toEqual(error);
    });
  });

  describe('register', () => {
    const registrationData = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      password_confirmation: 'password123',
    };

    it('should fetch CSRF token before register', async () => {
      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue(undefined);
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      await authService.register(registrationData);

      expect(apiService.fetchCSRFToken).toHaveBeenCalledOnce();
    });

    it('should call register endpoint with data', async () => {
      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue(undefined);
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      await authService.register(registrationData);

      expect(apiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.auth.register(), registrationData, {
        signal: undefined,
      });
    });

    it('should return user data', async () => {
      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue(undefined);
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      const result = await authService.register(registrationData);

      expect(result).toEqual(mockUser);
    });

    it('should handle AbortSignal', async () => {
      const abortController = new AbortController();
      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue(undefined);
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      await authService.register(registrationData, abortController.signal);

      expect(apiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.auth.register(), registrationData, {
        signal: abortController.signal,
      });
    });

    it('should handle validation errors', async () => {
      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue(undefined);
      const error = {
        response: {
          status: 422,
          data: {
            errors: {
              email: ['Email already taken'],
              password: ['Password too weak'],
            },
          },
        },
      };
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(authService.register(registrationData)).rejects.toEqual(error);
    });
  });

  describe('requestPasswordReset', () => {
    const email = 'john@example.com';

    it('should call forgot password endpoint', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({});

      await authService.requestPasswordReset(email);

      expect(apiClient.post).toHaveBeenCalledWith(
        API_ENDPOINTS.auth.forgotPassword(),
        { email },
        { signal: undefined },
      );
    });

    it('should handle AbortSignal', async () => {
      const abortController = new AbortController();
      vi.mocked(apiClient.post).mockResolvedValue({});

      await authService.requestPasswordReset(email, abortController.signal);

      expect(apiClient.post).toHaveBeenCalledWith(
        API_ENDPOINTS.auth.forgotPassword(),
        { email },
        { signal: abortController.signal },
      );
    });

    it('should handle invalid email', async () => {
      const error = {
        response: {
          status: 422,
          data: { errors: { email: ['Invalid email address'] } },
        },
      };
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(authService.requestPasswordReset(email)).rejects.toEqual(error);
    });

    it('should handle rate limiting', async () => {
      const error = {
        response: {
          status: 429,
          data: { message: 'Too many requests' },
        },
      };
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(authService.requestPasswordReset(email)).rejects.toEqual(error);
    });
  });

  describe('resetPassword', () => {
    const resetData = {
      email: 'john@example.com',
      token: 'reset-token-123',
      password: 'newpassword123',
      password_confirmation: 'newpassword123',
    };

    it('should call reset password endpoint', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({});

      await authService.resetPassword(resetData);

      expect(apiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.auth.resetPassword(), resetData, {
        signal: undefined,
      });
    });

    it('should handle AbortSignal', async () => {
      const abortController = new AbortController();
      vi.mocked(apiClient.post).mockResolvedValue({});

      await authService.resetPassword(resetData, abortController.signal);

      expect(apiClient.post).toHaveBeenCalledWith(API_ENDPOINTS.auth.resetPassword(), resetData, {
        signal: abortController.signal,
      });
    });

    it('should handle invalid token', async () => {
      const error = {
        response: {
          status: 422,
          data: { errors: { token: ['Invalid or expired token'] } },
        },
      };
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(authService.resetPassword(resetData)).rejects.toEqual(error);
    });

    it('should handle validation errors', async () => {
      const error = {
        response: {
          status: 422,
          data: {
            errors: {
              password: ['Password must be at least 8 characters'],
              password_confirmation: ['Passwords do not match'],
            },
          },
        },
      };
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(authService.resetPassword(resetData)).rejects.toEqual(error);
    });
  });

  describe('grouped export', () => {
    it('should export all functions', () => {
      expect(authService.authService).toBeDefined();
      expect(authService.authService.login).toBe(authService.login);
      expect(authService.authService.logout).toBe(authService.logout);
      expect(authService.authService.checkAuth).toBe(authService.checkAuth);
      expect(authService.authService.resendVerificationEmail).toBe(
        authService.resendVerificationEmail,
      );
      expect(authService.authService.updateProfile).toBe(authService.updateProfile);
      expect(authService.authService.impersonate).toBe(authService.impersonate);
      expect(authService.authService.register).toBe(authService.register);
      expect(authService.authService.requestPasswordReset).toBe(authService.requestPasswordReset);
      expect(authService.authService.resetPassword).toBe(authService.resetPassword);
    });
  });
});
