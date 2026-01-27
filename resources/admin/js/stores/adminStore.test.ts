import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAdminStore } from './adminStore';
import { authService } from '@admin/services/authService';
import type { LoginCredentials } from '@admin/types/admin';
import { createMockAdmin } from '@admin/__tests__/helpers/mockFactories';

vi.mock('@admin/services/authService');
vi.mock('@admin/stores/siteConfigStore', () => ({
  useSiteConfigStore: () => ({
    fetchSiteConfig: vi.fn(),
    clearConfig: vi.fn(),
  }),
}));

describe('useAdminStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  const mockAdmin = createMockAdmin();

  it('should initialize with default state', () => {
    const store = useAdminStore();

    expect(store.admin).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(store.isLoading).toBe(false);
  });

  it('should login successfully', async () => {
    const store = useAdminStore();
    const credentials: LoginCredentials = {
      email: 'admin@example.com',
      password: 'password',
      remember: false,
    };

    vi.mocked(authService.login).mockResolvedValue(mockAdmin);

    await store.login(credentials);

    expect(store.admin).toEqual(mockAdmin);
    expect(store.isAuthenticated).toBe(true);
    expect(authService.login).toHaveBeenCalledWith(credentials);
  });

  it('should logout successfully', async () => {
    const store = useAdminStore();
    store.setAdmin(mockAdmin);

    vi.mocked(authService.logout).mockResolvedValue();

    await store.logout();

    expect(store.admin).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(authService.logout).toHaveBeenCalled();
  });

  it('should check auth successfully', async () => {
    const store = useAdminStore();

    vi.mocked(authService.checkAuth).mockResolvedValue(mockAdmin);

    const result = await store.checkAuth();

    expect(result).toBe(true);
    expect(store.admin).toEqual(mockAdmin);
    expect(store.isAuthenticated).toBe(true);
  });

  it('should handle auth check failure', async () => {
    const store = useAdminStore();
    store.setAdmin(mockAdmin);

    vi.mocked(authService.checkAuth).mockResolvedValue(null);

    const result = await store.checkAuth();

    expect(result).toBe(false);
    expect(store.admin).toBeNull();
    expect(store.isAuthenticated).toBe(false);
  });

  it('should return adminName getter', () => {
    const store = useAdminStore();

    expect(store.adminName).toBe('Administrator');

    store.setAdmin(mockAdmin);
    expect(store.adminName).toBe(mockAdmin.name);
  });

  it('should return adminRole getter', () => {
    const store = useAdminStore();

    expect(store.adminRole).toBeNull();

    store.setAdmin(mockAdmin);
    expect(store.adminRole).toBe('admin');
  });

  it('should check isSuperAdmin', () => {
    const store = useAdminStore();

    expect(store.isSuperAdmin).toBe(false);

    store.setAdmin({ ...mockAdmin, role: 'super_admin' });
    expect(store.isSuperAdmin).toBe(true);
  });

  it('should check isAdmin', () => {
    const store = useAdminStore();

    expect(store.isAdmin).toBe(false);

    store.setAdmin({ ...mockAdmin, role: 'admin' });
    expect(store.isAdmin).toBe(true);

    store.setAdmin({ ...mockAdmin, role: 'super_admin' });
    expect(store.isAdmin).toBe(true);

    store.setAdmin({ ...mockAdmin, role: 'moderator' });
    expect(store.isAdmin).toBe(false);
  });

  it('should check hasRole', () => {
    const store = useAdminStore();
    store.setAdmin(mockAdmin);

    expect(store.hasRole('admin')).toBe(true);
    expect(store.hasRole('super_admin')).toBe(false);
  });
});
