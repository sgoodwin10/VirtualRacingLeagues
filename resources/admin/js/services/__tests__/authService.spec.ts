import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../authService';
import { apiService } from '../api';
import type { LoginCredentials } from '@admin/types/admin';
import { createMockAdmin } from '@admin/__tests__/helpers/mockFactories';

vi.mock('../api');

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const mockAdmin = createMockAdmin();

  it('should login successfully', async () => {
    const credentials: LoginCredentials = {
      email: 'admin@example.com',
      password: 'password',
      remember: false,
    };

    vi.mocked(apiService.fetchCSRFToken).mockResolvedValue(undefined);
    vi.mocked(apiService.post).mockResolvedValue({
      success: true,
      data: { admin: mockAdmin },
    });

    const result = await authService.login(credentials);

    expect(result).toEqual(mockAdmin);
    expect(apiService.fetchCSRFToken).toHaveBeenCalledWith();
    expect(apiService.post).toHaveBeenCalledWith('/login', credentials, { signal: undefined });
  });

  it('should store remember preference on login', async () => {
    const credentials: LoginCredentials = {
      email: 'admin@example.com',
      password: 'password',
      remember: true,
    };

    vi.mocked(apiService.fetchCSRFToken).mockResolvedValue(undefined);
    vi.mocked(apiService.post).mockResolvedValue({
      success: true,
      data: { admin: mockAdmin },
    });

    await authService.login(credentials);

    expect(localStorage.getItem('admin_remember')).toBe('true');
  });

  it('should logout successfully', async () => {
    localStorage.setItem('admin_remember', 'true');
    vi.mocked(apiService.post).mockResolvedValue({ success: true });

    await authService.logout();

    expect(apiService.post).toHaveBeenCalledWith('/logout', {}, { signal: undefined });
    expect(localStorage.getItem('admin_remember')).toBeNull();
  });

  it('should check auth status', async () => {
    vi.mocked(apiService.get).mockResolvedValue({
      data: { authenticated: true, admin: mockAdmin },
    });

    const result = await authService.checkAuth();

    expect(result).toEqual(mockAdmin);
    expect(apiService.get).toHaveBeenCalledWith('/auth/check', { signal: undefined });
  });

  it('should return null when not authenticated', async () => {
    vi.mocked(apiService.get).mockResolvedValue({
      data: { authenticated: false },
    });

    const result = await authService.checkAuth();

    expect(result).toBeNull();
  });

  it('should get current admin', async () => {
    vi.mocked(apiService.get).mockResolvedValue({
      success: true,
      data: { admin: mockAdmin },
    });

    const result = await authService.getCurrentAdmin();

    expect(result).toEqual(mockAdmin);
    expect(apiService.get).toHaveBeenCalledWith('/auth/me', { signal: undefined });
  });

  it('should check remember me status', () => {
    expect(authService.hasRememberMe()).toBe(false);

    localStorage.setItem('admin_remember', 'true');
    expect(authService.hasRememberMe()).toBe(true);
  });

  it('should check if session is likely expired', () => {
    expect(authService.isSessionLikelyExpired()).toBe(true);

    localStorage.setItem('admin_remember', 'true');
    expect(authService.isSessionLikelyExpired()).toBe(false);
  });
});
