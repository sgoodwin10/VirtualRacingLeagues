import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authService } from '../authService';
import { apiClient, apiService } from '../api';
import type { User } from '@public/types/user';
import type { LoginCredentials, RegisterData } from '@public/types/auth';
import { AxiosError } from 'axios';

vi.mock('../api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
  apiService: {
    fetchCSRFToken: vi.fn(),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('register', () => {
    it('should fetch CSRF token and register user', async () => {
      const registerData: RegisterData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        password_confirmation: 'password123',
      };

      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue(undefined);
      vi.mocked(apiClient.post).mockResolvedValue({ data: {} });

      await authService.register(registerData);

      expect(apiService.fetchCSRFToken).toHaveBeenCalledOnce();
      expect(apiClient.post).toHaveBeenCalledWith('/register', registerData, { signal: undefined });
    });

    it('should pass abort signal to API call', async () => {
      const registerData: RegisterData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        password: 'password123',
        password_confirmation: 'password123',
      };
      const abortController = new AbortController();

      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue(undefined);
      vi.mocked(apiClient.post).mockResolvedValue({ data: {} });

      await authService.register(registerData, abortController.signal);

      expect(apiClient.post).toHaveBeenCalledWith('/register', registerData, {
        signal: abortController.signal,
      });
    });
  });

  describe('login', () => {
    it('should fetch CSRF token and login user', async () => {
      const credentials: LoginCredentials = {
        email: 'john@example.com',
        password: 'password123',
        remember: false,
      };

      const mockUser: User = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        email_verified_at: '2023-01-01T00:00:00Z',
      };

      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue(undefined);
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      const result = await authService.login(credentials);

      expect(apiService.fetchCSRFToken).toHaveBeenCalledOnce();
      expect(apiClient.post).toHaveBeenCalledWith('/login', credentials, { signal: undefined });
      expect(result).toEqual(mockUser);
    });

    it('should pass abort signal to API call', async () => {
      const credentials: LoginCredentials = {
        email: 'john@example.com',
        password: 'password123',
        remember: false,
      };
      const abortController = new AbortController();

      const mockUser: User = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        email_verified_at: '2023-01-01T00:00:00Z',
      };

      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue(undefined);
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      await authService.login(credentials, abortController.signal);

      expect(apiClient.post).toHaveBeenCalledWith('/login', credentials, {
        signal: abortController.signal,
      });
    });
  });

  describe('logout', () => {
    it('should call logout endpoint', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: {} });

      await authService.logout();

      expect(apiClient.post).toHaveBeenCalledWith('/logout', {}, { signal: undefined });
    });

    it('should not throw error if API call fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Network error');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      await expect(authService.logout()).resolves.toBeUndefined();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Logout API error:', error);
      consoleErrorSpy.mockRestore();
    });

    it('should pass abort signal to API call', async () => {
      const abortController = new AbortController();
      vi.mocked(apiClient.post).mockResolvedValue({ data: {} });

      await authService.logout(abortController.signal);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/logout',
        {},
        { signal: abortController.signal },
      );
    });
  });

  describe('checkAuth', () => {
    const mockUser: User = {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      email_verified_at: '2023-01-01T00:00:00Z',
    };

    it('should return user data when authenticated', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      const result = await authService.checkAuth();

      expect(apiClient.get).toHaveBeenCalledWith('/me', { signal: undefined });
      expect(result).toEqual(mockUser);
    });

    it('should return null for 401 Unauthorized', async () => {
      const error = new AxiosError(
        'Unauthorized',
        '401',
        undefined,
        {},
        {
          status: 401,
          statusText: 'Unauthorized',
          data: {},
          headers: {},
          config: {} as any,
        },
      );
      vi.mocked(apiClient.get).mockRejectedValue(error);

      const result = await authService.checkAuth();

      expect(result).toBeNull();
    });

    it('should return null for 404 Not Found', async () => {
      const error = new AxiosError(
        'Not Found',
        '404',
        undefined,
        {},
        {
          status: 404,
          statusText: 'Not Found',
          data: {},
          headers: {},
          config: {} as any,
        },
      );
      vi.mocked(apiClient.get).mockRejectedValue(error);

      const result = await authService.checkAuth();

      expect(result).toBeNull();
    });

    it('should throw error for 500 Internal Server Error', async () => {
      const error = new AxiosError(
        'Internal Server Error',
        '500',
        undefined,
        {},
        {
          status: 500,
          statusText: 'Internal Server Error',
          data: {},
          headers: {},
          config: {} as any,
        },
      );
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(authService.checkAuth()).rejects.toThrow(error);
    });

    it('should throw error for 503 Service Unavailable', async () => {
      const error = new AxiosError(
        'Service Unavailable',
        '503',
        undefined,
        {},
        {
          status: 503,
          statusText: 'Service Unavailable',
          data: {},
          headers: {},
          config: {} as any,
        },
      );
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(authService.checkAuth()).rejects.toThrow(error);
    });

    it('should throw error for network errors', async () => {
      const error = new AxiosError('Network Error', 'ERR_NETWORK');
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(authService.checkAuth()).rejects.toThrow(error);
    });

    it('should throw error for timeout errors', async () => {
      const error = new AxiosError('Timeout', 'ECONNABORTED');
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(authService.checkAuth()).rejects.toThrow(error);
    });

    it('should throw non-Axios errors', async () => {
      const error = new Error('Unexpected error');
      vi.mocked(apiClient.get).mockRejectedValue(error);

      await expect(authService.checkAuth()).rejects.toThrow(error);
    });

    it('should pass abort signal to API call', async () => {
      const abortController = new AbortController();
      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      await authService.checkAuth(abortController.signal);

      expect(apiClient.get).toHaveBeenCalledWith('/me', { signal: abortController.signal });
    });
  });

  describe('resendVerificationEmail', () => {
    it('should call resend email endpoint', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: {} });

      await authService.resendVerificationEmail();

      expect(apiClient.post).toHaveBeenCalledWith('/email/resend', {}, { signal: undefined });
    });

    it('should pass abort signal to API call', async () => {
      const abortController = new AbortController();
      vi.mocked(apiClient.post).mockResolvedValue({ data: {} });

      await authService.resendVerificationEmail(abortController.signal);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/email/resend',
        {},
        {
          signal: abortController.signal,
        },
      );
    });
  });

  describe('requestPasswordReset', () => {
    it('should fetch CSRF token and request password reset', async () => {
      const email = 'john@example.com';

      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue(undefined);
      vi.mocked(apiClient.post).mockResolvedValue({ data: {} });

      await authService.requestPasswordReset(email);

      expect(apiService.fetchCSRFToken).toHaveBeenCalledOnce();
      expect(apiClient.post).toHaveBeenCalledWith(
        '/forgot-password',
        { email },
        { signal: undefined },
      );
    });

    it('should pass abort signal to API call', async () => {
      const email = 'john@example.com';
      const abortController = new AbortController();

      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue(undefined);
      vi.mocked(apiClient.post).mockResolvedValue({ data: {} });

      await authService.requestPasswordReset(email, abortController.signal);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/forgot-password',
        { email },
        {
          signal: abortController.signal,
        },
      );
    });
  });

  describe('resetPassword', () => {
    it('should fetch CSRF token and reset password', async () => {
      const resetData = {
        email: 'john@example.com',
        token: 'reset-token',
        password: 'newpassword123',
        password_confirmation: 'newpassword123',
      };

      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue(undefined);
      vi.mocked(apiClient.post).mockResolvedValue({ data: {} });

      await authService.resetPassword(resetData);

      expect(apiService.fetchCSRFToken).toHaveBeenCalledOnce();
      expect(apiClient.post).toHaveBeenCalledWith('/reset-password', resetData, {
        signal: undefined,
      });
    });

    it('should pass abort signal to API call', async () => {
      const resetData = {
        email: 'john@example.com',
        token: 'reset-token',
        password: 'newpassword123',
        password_confirmation: 'newpassword123',
      };
      const abortController = new AbortController();

      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue(undefined);
      vi.mocked(apiClient.post).mockResolvedValue({ data: {} });

      await authService.resetPassword(resetData, abortController.signal);

      expect(apiClient.post).toHaveBeenCalledWith('/reset-password', resetData, {
        signal: abortController.signal,
      });
    });
  });
});
