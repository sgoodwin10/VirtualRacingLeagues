import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '@admin/services/authService';
import type { Admin, AdminRole, LoginCredentials } from '@admin/types/admin';
import { useSiteConfigStore } from '@admin/stores/siteConfigStore';
import { logger } from '@admin/utils/logger';
import { setSentryAdmin, clearSentryUser } from '@admin/sentry';

/**
 * Admin Store
 * Manages admin authentication state
 *
 * Persistence:
 * - Uses pinia-plugin-persistedstate to persist auth state
 * - Only persists: admin, isAuthenticated
 * - Storage: sessionStorage (for security - cleared when browser/tab closes)
 * - Does NOT persist: isLoading, authCheckPromise (temporary state)
 */
export const useAdminStore = defineStore(
  'admin',
  () => {
    // State
    const admin = ref<Admin | null>(null);
    const isAuthenticated = ref(false);
    const isLoading = ref(false);
    const authCheckPromise = ref<Promise<boolean> | null>(null);

    // Getters
    /**
     * Get admin name or default
     */
    const adminName = computed((): string => admin.value?.name || 'Administrator');

    /**
     * Get admin email
     */
    const adminEmail = computed((): string => admin.value?.email || '');

    /**
     * Get admin role
     */
    const adminRole = computed((): AdminRole | null => admin.value?.role || null);

    /**
     * Check if admin has a specific role
     */
    const hasRole = computed(() => (role: AdminRole): boolean => {
      return admin.value?.role === role;
    });

    /**
     * Check if admin is super admin
     */
    const isSuperAdmin = computed((): boolean => {
      return admin.value?.role === 'super_admin';
    });

    /**
     * Check if admin is at least admin level
     */
    const isAdmin = computed((): boolean => {
      return admin.value?.role === 'super_admin' || admin.value?.role === 'admin';
    });

    // Actions
    /**
     * Login with credentials
     */
    async function login(credentials: LoginCredentials): Promise<void> {
      isLoading.value = true;
      try {
        const adminData = await authService.login(credentials);
        setAdmin(adminData);
      } finally {
        isLoading.value = false;
      }
    }

    /**
     * Logout the current admin
     */
    async function logout(): Promise<void> {
      isLoading.value = true;
      try {
        await authService.logout();
      } finally {
        clearAuth();
        isLoading.value = false;
      }
    }

    /**
     * Check authentication status
     * Prevents concurrent auth checks by caching the promise
     */
    async function checkAuth(): Promise<boolean> {
      // If an auth check is already in progress, return that promise
      if (authCheckPromise.value) {
        return authCheckPromise.value;
      }

      isLoading.value = true;

      // Create and cache the promise
      authCheckPromise.value = (async () => {
        try {
          const adminData = await authService.checkAuth();
          if (adminData) {
            setAdmin(adminData);
            return true;
          } else {
            clearAuth();
            return false;
          }
        } catch (error) {
          logger.error('Auth check failed:', error);
          clearAuth();
          return false;
        } finally {
          isLoading.value = false;
          // Clear the cached promise after it completes
          authCheckPromise.value = null;
        }
      })();

      return authCheckPromise.value;
    }

    /**
     * Set admin data
     */
    function setAdmin(adminData: Admin): void {
      admin.value = adminData;
      isAuthenticated.value = true;

      // Set Sentry user context for error tracking
      setSentryAdmin({
        id: adminData.id,
        name: adminData.name,
        email: adminData.email,
      });

      // Fetch site config when admin is authenticated
      const siteConfigStore = useSiteConfigStore();
      siteConfigStore.fetchSiteConfig();
    }

    /**
     * Clear authentication state
     */
    function clearAuth(): void {
      admin.value = null;
      isAuthenticated.value = false;

      // Clear Sentry user context
      clearSentryUser();

      // Clear site config when admin logs out
      const siteConfigStore = useSiteConfigStore();
      siteConfigStore.clearConfig();
    }

    return {
      // State
      admin,
      isAuthenticated,
      isLoading,
      authCheckPromise,

      // Getters
      adminName,
      adminEmail,
      adminRole,
      hasRole,
      isSuperAdmin,
      isAdmin,

      // Actions
      login,
      logout,
      checkAuth,
      setAdmin,
      clearAuth,
    };
  },
  {
    persist: {
      storage: sessionStorage,
      // Only persist essential auth data
      // Do not persist promises (authCheckPromise) or temporary state (isLoading)
      pick: ['admin', 'isAuthenticated'],
    },
  },
);
