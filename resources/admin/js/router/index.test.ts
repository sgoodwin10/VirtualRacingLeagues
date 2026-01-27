import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import router from './index';
import { useAdminStore } from '@admin/stores/adminStore';
import type { AdminRole } from '@admin/types/admin';

vi.mock('@admin/composables/useRoleHelpers', () => ({
  useRoleHelpers: () => ({
    hasRoleAccess: (userRole: AdminRole, requiredRole: AdminRole): boolean => {
      const roleHierarchy: Record<AdminRole, number> = {
        super_admin: 3,
        admin: 2,
        moderator: 1,
      };
      return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
    },
  }),
}));

describe('Router', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should have required routes', () => {
    const routes = router.getRoutes();
    const routeNames = routes.map((r) => r.name);

    expect(routeNames).toContain('login');
    expect(routeNames).toContain('dashboard');
    expect(routeNames).toContain('users');
    expect(routeNames).toContain('admin-users');
    expect(routeNames).toContain('settings');
    expect(routeNames).toContain('site-config');
    expect(routeNames).toContain('activity-logs');
  });

  it('should mark login as public route', () => {
    const loginRoute = router.getRoutes().find((r) => r.name === 'login');
    expect(loginRoute?.meta?.isPublic).toBe(true);
    expect(loginRoute?.meta?.requiresAuth).toBeUndefined();
  });

  it('should mark dashboard as protected route', () => {
    const dashboardRoute = router.getRoutes().find((r) => r.name === 'dashboard');
    expect(dashboardRoute?.meta?.requiresAuth).toBe(true);
  });

  it('should require admin role for admin-users route', () => {
    const adminUsersRoute = router.getRoutes().find((r) => r.name === 'admin-users');
    expect(adminUsersRoute?.meta?.requiresAuth).toBe(true);
    expect(adminUsersRoute?.meta?.requiredRole).toBe('admin');
  });

  it('should require super_admin role for site-config route', () => {
    const siteConfigRoute = router.getRoutes().find((r) => r.name === 'site-config');
    expect(siteConfigRoute?.meta?.requiresAuth).toBe(true);
    expect(siteConfigRoute?.meta?.requiredRole).toBe('super_admin');
  });

  it('should have breadcrumbs for routes', () => {
    const usersRoute = router.getRoutes().find((r) => r.name === 'users');
    expect(usersRoute?.meta?.breadcrumb).toEqual([{ label: 'Users' }]);

    const adminUsersRoute = router.getRoutes().find((r) => r.name === 'admin-users');
    expect(adminUsersRoute?.meta?.breadcrumb).toEqual([
      { label: 'Settings' },
      { label: 'Admin Users' },
    ]);
  });

  it('should set page title on navigation', async () => {
    const adminStore = useAdminStore();
    adminStore.setAdmin({
      id: 1,
      name: 'Admin',
      email: 'admin@example.com',
      role: 'super_admin',
      status: 'active',
      last_login_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    vi.spyOn(adminStore, 'checkAuth').mockResolvedValue(true);

    await router.push('/');
    await router.isReady();

    expect(document.title).toBe('Dashboard - Admin Dashboard');
  });
});
