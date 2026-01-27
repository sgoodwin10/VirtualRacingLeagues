import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from './authStore';
import { authService } from '@public/services/authService';
import type { User } from '@public/types/user';
import type { LoginCredentials, RegisterData } from '@public/types/auth';

// Mock dependencies
vi.mock('@public/services/authService');
vi.mock('@public/utils/subdomain', () => ({
  getAppSubdomainUrl: vi.fn(() => 'http://app.example.com'),
}));

describe('useAuthStore', () => {
  const mockUser: User = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    email_verified_at: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    localStorage.clear();
    // Mock window.location.href
    delete (window as any).location;
    (window as any).location = { href: '' };
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('state initialization', () => {
    it('should initialize with null user', () => {
      const store = useAuthStore();
      expect(store.user).toBeNull();
    });

    it('should initialize with isAuthenticated false', () => {
      const store = useAuthStore();
      expect(store.isAuthenticated).toBe(false);
    });

    it('should initialize with isLoading false', () => {
      const store = useAuthStore();
      expect(store.isLoading).toBe(false);
    });
  });

  describe('userName getter', () => {
    it('should return "Guest" when user is null', () => {
      const store = useAuthStore();
      expect(store.userName).toBe('Guest');
    });

    it('should return full name when user is set', () => {
      const store = useAuthStore();
      store.user = mockUser;
      expect(store.userName).toBe('John Doe');
    });

    it('should handle missing first name', () => {
      const store = useAuthStore();
      store.user = { ...mockUser, first_name: '' };
      expect(store.userName).toBe('Doe');
    });

    it('should handle missing last name', () => {
      const store = useAuthStore();
      store.user = { ...mockUser, last_name: '' };
      expect(store.userName).toBe('John');
    });

    it('should return "Guest" when both names are empty', () => {
      const store = useAuthStore();
      store.user = { ...mockUser, first_name: '', last_name: '' };
      expect(store.userName).toBe('Guest');
    });

    it('should trim whitespace from names', () => {
      const store = useAuthStore();
      store.user = { ...mockUser, first_name: '  John  ', last_name: '  Doe  ' };
      // Note: String template adds single space between first and last name, then trims
      expect(store.userName).toBe('John     Doe');
    });
  });

  describe('register', () => {
    const registerData: RegisterData = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      password_confirmation: 'password123',
    };

    it('should call authService.register', async () => {
      vi.mocked(authService.register).mockResolvedValue(mockUser);
      const store = useAuthStore();

      await store.register(registerData);

      expect(authService.register).toHaveBeenCalledWith(registerData);
    });

    it('should set isLoading to true during registration', async () => {
      vi.mocked(authService.register).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockUser), 100);
          }),
      );
      const store = useAuthStore();

      const promise = store.register(registerData);
      expect(store.isLoading).toBe(true);

      await promise;
    });

    it('should set isLoading to false after registration', async () => {
      vi.mocked(authService.register).mockResolvedValue(mockUser);
      const store = useAuthStore();

      await store.register(registerData);

      expect(store.isLoading).toBe(false);
    });

    it('should return user email', async () => {
      vi.mocked(authService.register).mockResolvedValue(mockUser);
      const store = useAuthStore();

      const result = await store.register(registerData);

      expect(result).toBe(registerData.email);
    });

    it('should set isLoading to false on error', async () => {
      const error = new Error('Registration failed');
      vi.mocked(authService.register).mockRejectedValue(error);
      const store = useAuthStore();

      await expect(store.register(registerData)).rejects.toThrow('Registration failed');
      expect(store.isLoading).toBe(false);
    });

    it('should handle validation errors', async () => {
      const error = {
        response: {
          status: 422,
          data: { errors: { email: ['Email already taken'] } },
        },
      };
      vi.mocked(authService.register).mockRejectedValue(error);
      const store = useAuthStore();

      await expect(store.register(registerData)).rejects.toEqual(error);
    });
  });

  describe('login', () => {
    const credentials: LoginCredentials = {
      email: 'john@example.com',
      password: 'password123',
    };

    it('should call authService.login', async () => {
      vi.mocked(authService.login).mockResolvedValue(mockUser);
      const store = useAuthStore();

      await store.login(credentials);

      expect(authService.login).toHaveBeenCalledWith(credentials);
    });

    it('should set isLoading to true during login', async () => {
      vi.mocked(authService.login).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockUser), 100);
          }),
      );
      const store = useAuthStore();

      const promise = store.login(credentials);
      expect(store.isLoading).toBe(true);

      await promise;
    });

    it('should set isLoading to false after login', async () => {
      vi.mocked(authService.login).mockResolvedValue(mockUser);
      const store = useAuthStore();

      await store.login(credentials);

      expect(store.isLoading).toBe(false);
    });

    it('should set user data', async () => {
      vi.mocked(authService.login).mockResolvedValue(mockUser);
      const store = useAuthStore();

      await store.login(credentials);

      expect(store.user).toEqual(mockUser);
    });

    it('should set isAuthenticated to true', async () => {
      vi.mocked(authService.login).mockResolvedValue(mockUser);
      const store = useAuthStore();

      await store.login(credentials);

      expect(store.isAuthenticated).toBe(true);
    });

    it('should redirect to app subdomain', async () => {
      vi.mocked(authService.login).mockResolvedValue(mockUser);
      const store = useAuthStore();

      await store.login(credentials);

      expect(window.location.href).toBe('http://app.example.com');
    });

    it('should set isLoading to false on error', async () => {
      const error = new Error('Login failed');
      vi.mocked(authService.login).mockRejectedValue(error);
      const store = useAuthStore();

      await expect(store.login(credentials)).rejects.toThrow('Login failed');
      expect(store.isLoading).toBe(false);
    });

    it('should handle 422 validation errors', async () => {
      const error = {
        response: {
          status: 422,
          data: { message: 'Invalid credentials' },
        },
      };
      vi.mocked(authService.login).mockRejectedValue(error);
      const store = useAuthStore();

      await expect(store.login(credentials)).rejects.toEqual(error);
      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe('logout', () => {
    it('should call authService.logout', async () => {
      vi.mocked(authService.logout).mockResolvedValue();
      const store = useAuthStore();

      await store.logout();

      expect(authService.logout).toHaveBeenCalled();
    });

    it('should clear user data', async () => {
      vi.mocked(authService.logout).mockResolvedValue();
      const store = useAuthStore();
      store.user = mockUser;
      store.isAuthenticated = true;

      await store.logout();

      expect(store.user).toBeNull();
    });

    it('should set isAuthenticated to false', async () => {
      vi.mocked(authService.logout).mockResolvedValue();
      const store = useAuthStore();
      store.isAuthenticated = true;

      await store.logout();

      expect(store.isAuthenticated).toBe(false);
    });

    it('should redirect to /login', async () => {
      vi.mocked(authService.logout).mockResolvedValue();
      const store = useAuthStore();

      await store.logout();

      expect(window.location.href).toBe('/login');
    });

    it('should clear auth even if API call fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Logout failed');
      vi.mocked(authService.logout).mockRejectedValue(error);
      const store = useAuthStore();
      store.user = mockUser;
      store.isAuthenticated = true;

      await store.logout();

      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(false);
      expect(window.location.href).toBe('/login');

      consoleErrorSpy.mockRestore();
    });

    it('should still redirect on API error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(authService.logout).mockRejectedValue(new Error('API Error'));
      const store = useAuthStore();

      await store.logout();

      expect(window.location.href).toBe('/login');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('checkAuth', () => {
    it('should call authService.checkAuth', async () => {
      vi.mocked(authService.checkAuth).mockResolvedValue(mockUser);
      const store = useAuthStore();

      await store.checkAuth();

      expect(authService.checkAuth).toHaveBeenCalled();
    });

    it('should set user if authenticated', async () => {
      vi.mocked(authService.checkAuth).mockResolvedValue(mockUser);
      const store = useAuthStore();

      await store.checkAuth();

      expect(store.user).toEqual(mockUser);
    });

    it('should set isAuthenticated to true if user exists', async () => {
      vi.mocked(authService.checkAuth).mockResolvedValue(mockUser);
      const store = useAuthStore();

      await store.checkAuth();

      expect(store.isAuthenticated).toBe(true);
    });

    it('should return true if authenticated', async () => {
      vi.mocked(authService.checkAuth).mockResolvedValue(mockUser);
      const store = useAuthStore();

      const result = await store.checkAuth();

      expect(result).toBe(true);
    });

    it('should clear auth if not authenticated', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(authService.checkAuth).mockRejectedValue({ response: { status: 401 } });
      const store = useAuthStore();
      store.user = mockUser;
      store.isAuthenticated = true;

      await store.checkAuth();

      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(false);

      consoleErrorSpy.mockRestore();
    });

    it('should return false if not authenticated', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(authService.checkAuth).mockRejectedValue({ response: { status: 401 } });
      const store = useAuthStore();

      const result = await store.checkAuth();

      expect(result).toBe(false);

      consoleErrorSpy.mockRestore();
    });

    it('should prevent concurrent auth checks', async () => {
      vi.mocked(authService.checkAuth).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockUser), 100);
          }),
      );
      const store = useAuthStore();

      const promise1 = store.checkAuth();
      const promise2 = store.checkAuth();
      const promise3 = store.checkAuth();

      await Promise.all([promise1, promise2, promise3]);

      // Should only call service once
      expect(authService.checkAuth).toHaveBeenCalledTimes(1);
    });

    it('should allow new check after previous completes', async () => {
      vi.mocked(authService.checkAuth).mockResolvedValue(mockUser);
      const store = useAuthStore();

      await store.checkAuth();
      await store.checkAuth();

      expect(authService.checkAuth).toHaveBeenCalledTimes(2);
    });

    it('should handle errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Network error');
      vi.mocked(authService.checkAuth).mockRejectedValue(error);
      const store = useAuthStore();

      const result = await store.checkAuth();

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Auth check failed:', error);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('resendVerificationEmail', () => {
    it('should call authService.resendVerificationEmail', async () => {
      vi.mocked(authService.resendVerificationEmail).mockResolvedValue();
      const store = useAuthStore();

      await store.resendVerificationEmail();

      expect(authService.resendVerificationEmail).toHaveBeenCalled();
    });

    it('should propagate errors', async () => {
      const error = new Error('Resend failed');
      vi.mocked(authService.resendVerificationEmail).mockRejectedValue(error);
      const store = useAuthStore();

      await expect(store.resendVerificationEmail()).rejects.toThrow('Resend failed');
    });
  });

  describe('internal setUser behavior', () => {
    it('should set user data via login', async () => {
      vi.mocked(authService.login).mockResolvedValue(mockUser);
      const store = useAuthStore();

      await store.login({ email: 'test@example.com', password: 'password' });

      expect(store.user).toEqual(mockUser);
    });

    it('should set isAuthenticated to true via login', async () => {
      vi.mocked(authService.login).mockResolvedValue(mockUser);
      const store = useAuthStore();

      await store.login({ email: 'test@example.com', password: 'password' });

      expect(store.isAuthenticated).toBe(true);
    });
  });

  describe('clearAuth', () => {
    it('should clear user data', () => {
      const store = useAuthStore();
      store.user = mockUser;
      store.isAuthenticated = true;

      store.clearAuth();

      expect(store.user).toBeNull();
    });

    it('should set isAuthenticated to false', () => {
      const store = useAuthStore();
      store.isAuthenticated = true;

      store.clearAuth();

      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe('state management', () => {
    it('should maintain user data after login', async () => {
      vi.mocked(authService.login).mockResolvedValue(mockUser);
      const store = useAuthStore();

      await store.login({ email: 'test@example.com', password: 'password' });

      expect(store.user).toEqual(mockUser);
      expect(store.isAuthenticated).toBe(true);
    });

    it('should clear user data after clearAuth', async () => {
      vi.mocked(authService.login).mockResolvedValue(mockUser);
      const store = useAuthStore();

      await store.login({ email: 'test@example.com', password: 'password' });
      expect(store.user).toEqual(mockUser);
      expect(store.isAuthenticated).toBe(true);

      store.clearAuth();

      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(false);
    });

    it('should maintain authentication state through checkAuth', async () => {
      vi.mocked(authService.checkAuth).mockResolvedValue(mockUser);
      const store = useAuthStore();

      const result = await store.checkAuth();

      expect(result).toBe(true);
      expect(store.user).toEqual(mockUser);
      expect(store.isAuthenticated).toBe(true);
    });

    it('should clear state when checkAuth fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(authService.checkAuth).mockRejectedValue({ response: { status: 401 } });
      const store = useAuthStore();

      // Set initial state
      store.user = mockUser;
      store.isAuthenticated = true;

      const result = await store.checkAuth();

      expect(result).toBe(false);
      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(false);

      consoleErrorSpy.mockRestore();
    });

    it('should not mutate user data unexpectedly', async () => {
      vi.mocked(authService.login).mockResolvedValue(mockUser);
      vi.mocked(authService.checkAuth).mockResolvedValue(mockUser);
      const store = useAuthStore();

      await store.login({ email: 'test@example.com', password: 'password' });

      const userBefore = store.user;

      // Perform operations that should not mutate user
      await store.checkAuth();

      // User reference should remain the same if data hasn't changed
      expect(store.user).toEqual(userBefore);
    });
  });
});
