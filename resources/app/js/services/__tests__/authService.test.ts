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
      vi.mocked(apiClient.post).mockRejectedValue(new Error('Network error'));

      await expect(authService.logout()).resolves.not.toThrow();
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
      };

      vi.mocked(apiClient.get).mockResolvedValue({
        data: { data: { user: mockUser } },
      });

      const result = await authService.checkAuth();

      expect(apiClient.get).toHaveBeenCalledWith('/me', { signal: undefined });
      expect(result).toEqual(mockUser);
    });

    it('should return null if not authenticated', async () => {
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Unauthorized'));

      const result = await authService.checkAuth();

      expect(result).toBeNull();
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
});
