import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '@app/services/authService';
import { apiClient, apiService } from '@app/services/api';
import type { User } from '@app/types/user';

vi.mock('@app/services/api');

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should fetch CSRF token and login user', async () => {
      const mockUser: User = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        email_verified_at: null,
        is_admin: false,
      };

      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue();
      vi.mocked(apiClient.post).mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      const result = await authService.login({
        email: 'john@example.com',
        password: 'password',
      });

      expect(apiService.fetchCSRFToken).toHaveBeenCalled();
      expect(apiClient.post).toHaveBeenCalledWith(
        '/login',
        { email: 'john@example.com', password: 'password' },
        { signal: undefined },
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('logout', () => {
    it('should call logout endpoint', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({});

      await authService.logout();

      expect(apiClient.post).toHaveBeenCalledWith('/logout', {}, { signal: undefined });
    });

    it('should not throw error if logout fails', async () => {
      // Mock console.error to suppress error output in tests
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Network error'));

      await expect(authService.logout()).resolves.not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Logout API error:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('checkAuth', () => {
    it('should return user if authenticated', async () => {
      const mockUser: User = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        email_verified_at: null,
        is_admin: false,
      };

      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      const result = await authService.checkAuth();

      expect(apiClient.get).toHaveBeenCalledWith('/me', { signal: undefined });
      expect(result).toEqual(mockUser);
    });

    it('should throw error if not authenticated', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Unauthorized'));

      await expect(authService.checkAuth()).rejects.toThrow('Unauthorized');
    });
  });

  describe('resendVerificationEmail', () => {
    it('should call resend verification endpoint', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({});

      await authService.resendVerificationEmail();

      expect(apiClient.post).toHaveBeenCalledWith('/email/resend', {}, { signal: undefined });
    });
  });

  describe('updateProfile', () => {
    it('should update profile and return updated user', async () => {
      const updatedUser: User = {
        id: 1,
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        email_verified_at: null,
        is_admin: false,
      };

      vi.mocked(apiClient.put).mockResolvedValue({
        data: { data: { user: updatedUser } },
      });

      const result = await authService.updateProfile({
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
      });

      expect(apiClient.put).toHaveBeenCalledWith(
        '/profile',
        { first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' },
        { signal: undefined },
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('Network Edge Cases', () => {
    it('should handle network timeout on login', async () => {
      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue();
      vi.mocked(apiClient.post).mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      });

      await expect(
        authService.login({
          email: 'john@example.com',
          password: 'password',
        }),
      ).rejects.toMatchObject({
        code: 'ECONNABORTED',
      });
    });

    it('should handle network timeout on checkAuth', async () => {
      vi.mocked(apiClient.get).mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      });

      await expect(authService.checkAuth()).rejects.toMatchObject({
        code: 'ECONNABORTED',
      });
    });

    it('should handle network timeout on updateProfile', async () => {
      vi.mocked(apiClient.put).mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      });

      await expect(
        authService.updateProfile({
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'jane@example.com',
        }),
      ).rejects.toMatchObject({
        code: 'ECONNABORTED',
      });
    });

    it('should handle partial response on login', async () => {
      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue();
      vi.mocked(apiClient.post).mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      });

      await expect(
        authService.login({
          email: 'john@example.com',
          password: 'password',
        }),
      ).rejects.toMatchObject({
        response: {
          status: 500,
        },
      });
    });

    it('should handle network connection error', async () => {
      vi.mocked(apiService.fetchCSRFToken).mockResolvedValue();
      vi.mocked(apiClient.post).mockRejectedValue({
        code: 'ERR_NETWORK',
        message: 'Network Error',
      });

      await expect(
        authService.login({
          email: 'john@example.com',
          password: 'password',
        }),
      ).rejects.toMatchObject({
        code: 'ERR_NETWORK',
      });
    });
  });
});
