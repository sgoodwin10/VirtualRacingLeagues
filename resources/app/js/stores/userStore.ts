import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@app/types/user';
import type { LoginCredentials } from '@app/types/auth';
import { authService } from '@app/services/authService';
import { logError } from '@app/utils/logger';
import { setSentryUser, clearSentryUser } from '@app/sentry';

export const useUserStore = defineStore(
  'user',
  () => {
    // State
    const user = ref<User | null>(null);
    const isLoading = ref(false);

    // Private state for managing auth check concurrency
    let authCheckPromise: Promise<boolean> | null = null;

    // Getters
    const isAuthenticated = computed((): boolean => user.value !== null);
    const userName = computed((): string => {
      if (!user.value) return 'Guest';
      return `${user.value.first_name} ${user.value.last_name}`.trim() || 'Guest';
    });
    const userFirstName = computed((): string => user.value?.first_name || '');
    const userLastName = computed((): string => user.value?.last_name || '');
    const userEmail = computed((): string => user.value?.email || '');
    const isEmailVerified = computed((): boolean => user.value?.email_verified_at !== null);

    // Helper function to get public site URL
    const getPublicDomain = (): string => {
      const publicDomain = import.meta.env.VITE_PUBLIC_DOMAIN;
      // Build full URL with protocol from current location
      return `${window.location.protocol}//${publicDomain}`;
    };

    // Actions
    async function login(credentials: LoginCredentials): Promise<void> {
      isLoading.value = true;
      try {
        const userData = await authService.login(credentials);
        setUser(userData);
      } finally {
        isLoading.value = false;
      }
    }

    async function logout(): Promise<void> {
      try {
        await authService.logout();
      } catch (error) {
        logError('Logout error', { context: 'userStore', data: error });
      } finally {
        clearAuth();
        // Redirect to public site login page with logout flag to clear public auth store
        const publicDomain = getPublicDomain();
        window.location.href = `${publicDomain}/login?logout=1`;
      }
    }

    async function checkAuth(): Promise<boolean> {
      // Prevent concurrent auth checks
      if (authCheckPromise) {
        return authCheckPromise;
      }

      authCheckPromise = (async () => {
        try {
          const userData = await authService.checkAuth();

          if (userData) {
            setUser(userData);
            return true;
          } else {
            clearAuth();
            return false;
          }
        } catch (error) {
          logError('Auth check failed', { context: 'userStore', data: error });
          clearAuth();
          return false;
        } finally {
          authCheckPromise = null;
        }
      })();

      return authCheckPromise;
    }

    async function resendVerificationEmail(): Promise<void> {
      await authService.resendVerificationEmail();
    }

    async function updateProfile(data: {
      first_name: string;
      last_name: string;
      email: string;
      password?: string;
      password_confirmation?: string;
      current_password?: string;
    }): Promise<void> {
      isLoading.value = true;
      try {
        const updatedUser = await authService.updateProfile(data);
        setUser(updatedUser);
      } finally {
        isLoading.value = false;
      }
    }

    function setUser(userData: User): void {
      user.value = userData;
      // Set Sentry user context for error tracking
      setSentryUser({
        id: userData.id,
        name: `${userData.first_name} ${userData.last_name}`.trim(),
        email: userData.email,
      });
    }

    function clearAuth(): void {
      user.value = null;
      // Clear Sentry user context
      clearSentryUser();
    }

    return {
      // State
      user,
      isAuthenticated,
      isLoading,

      // Getters
      userName,
      userFirstName,
      userLastName,
      userEmail,
      isEmailVerified,

      // Actions
      login,
      logout,
      checkAuth,
      resendVerificationEmail,
      updateProfile,
    };
  },
  {
    persist: {
      storage: localStorage,
      pick: ['user'],
    },
  },
);
