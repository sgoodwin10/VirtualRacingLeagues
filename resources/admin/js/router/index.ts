import { createRouter, createWebHistory } from 'vue-router';
import { useAdminStore } from '@admin/stores/adminStore';
import AdminLayout from '@admin/components/layout/AdminLayout.vue';
import DashboardView from '@admin/views/DashboardView.vue';
import AdminLoginView from '@admin/views/AdminLoginView.vue';
import type { AdminRole } from '@admin/types/admin';
import { logger } from '@admin/utils/logger';
import { useRoleHelpers } from '@admin/composables/useRoleHelpers';

/**
 * Extend route meta with authentication fields
 */
declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    breadcrumb?: Array<{ label: string }>;
    requiresAuth?: boolean;
    requiredRole?: AdminRole;
    isPublic?: boolean;
  }
}

const routes = [
  // Public login route
  {
    path: '/login',
    name: 'login',
    component: AdminLoginView,
    meta: {
      title: 'Login',
      isPublic: true,
    },
  },

  // Protected admin routes
  {
    path: '/',
    component: AdminLayout,
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: DashboardView,
        meta: {
          title: 'Dashboard',
          breadcrumb: [{ label: 'Dashboard' }],
          requiresAuth: true,
        },
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('@admin/views/UsersView.vue'),
        meta: {
          title: 'Users',
          breadcrumb: [{ label: 'Users' }],
          requiresAuth: true,
        },
      },
      {
        path: 'admin-users',
        name: 'admin-users',
        component: () => import('@admin/views/AdminUsersView.vue'),
        meta: {
          title: 'Admin Users',
          breadcrumb: [{ label: 'Settings' }, { label: 'Admin Users' }],
          requiresAuth: true,
          requiredRole: 'admin' as AdminRole, // Only admins and super admins
        },
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@admin/views/SettingsView.vue'),
        meta: {
          title: 'Settings',
          breadcrumb: [{ label: 'Settings' }],
          requiresAuth: true,
          requiredRole: 'admin' as AdminRole, // Only admins and super admins
        },
      },
      {
        path: 'site-config',
        name: 'site-config',
        component: () => import('@admin/views/SiteConfigView.vue'),
        meta: {
          title: 'Site Configuration',
          breadcrumb: [{ label: 'Settings' }, { label: 'Site Configuration' }],
          requiresAuth: true,
          requiredRole: 'super_admin' as AdminRole, // Only super admins
        },
      },
      {
        path: 'activity-logs',
        name: 'activity-logs',
        component: () => import('@admin/views/ActivityLogView.vue'),
        meta: {
          title: 'Activity Logs',
          breadcrumb: [{ label: 'System' }, { label: 'Activity Logs' }],
          requiresAuth: true,
          requiredRole: 'admin' as AdminRole, // Only admins and super admins
        },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory('/'),
  routes,
});

/**
 * Global navigation guard for authentication
 */
router.beforeEach(async (to, _from, next) => {
  const adminStore = useAdminStore();

  // Set page title
  const title = to.meta.title as string;
  document.title = title ? `${title} - Admin Dashboard` : 'Admin Dashboard';

  // Check if route is public
  const isPublicRoute = to.meta.isPublic === true;

  // If public route, allow navigation
  if (isPublicRoute) {
    // If already authenticated and going to login, redirect to dashboard
    if (to.name === 'login' && adminStore.isAuthenticated) {
      next({ name: 'dashboard' });
      return;
    }
    next();
    return;
  }

  // Check if route requires authentication
  const requiresAuth = to.meta.requiresAuth === true;

  if (requiresAuth) {
    // Always check auth status to ensure it's current
    const isAuthenticated = await adminStore.checkAuth();

    if (!isAuthenticated) {
      // Redirect to login with return URL
      next({
        name: 'login',
        query: { redirect: to.fullPath },
      });
      return;
    }

    // Check role-based access
    const requiredRole = to.meta.requiredRole as AdminRole | undefined;

    if (requiredRole) {
      const { hasRoleAccess } = useRoleHelpers();
      const hasRequiredRole = hasRoleAccess(adminStore.adminRole, requiredRole);

      if (!hasRequiredRole) {
        // Redirect to dashboard if user doesn't have required role
        logger.warn(`Access denied: Required role ${requiredRole}`);
        next({ name: 'dashboard' });
        return;
      }
    }
  }

  // Allow navigation
  next();
});

export default router;
