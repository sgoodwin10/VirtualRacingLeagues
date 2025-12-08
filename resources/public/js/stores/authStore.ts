import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@public/types/user';
import type { LoginCredentials, RegisterData } from '@public/types/auth';
import { authService } from '@public/services/authService';

export const useAuthStore = defineStore(
  'auth',
  () => {
    // State
    const user = ref<User | null>(null);
    const isAuthenticated = ref(false);
    const isLoading = ref(false);
    const authCheckPromise = ref<Promise<boolean> | null>(null);

    // Getters
    const userName = computed((): string => {
      if (!user.value) return 'Guest';
      return `${user.value.first_name} ${user.value.last_name}`.trim() || 'Guest';
    });

    // Helper to get app subdomain URL
    const getAppSubdomainUrl = (): string => {
      // VITE_APP_DOMAIN already includes 'app.' prefix
      return `http://${import.meta.env.VITE_APP_DOMAIN}`;
    };

    // Actions
    async function register(data: RegisterData): Promise<void> {
      isLoading.value = true;
      try {
        await authService.register(data);
        // User is registered but not logged in yet (needs email verification)
        // Redirect to verify email page
      } finally {
        isLoading.value = false;
      }
    }

    async function login(credentials: LoginCredentials): Promise<void> {
      isLoading.value = true;
      try {
        const userData = await authService.login(credentials);
        setUser(userData);

        // After successful login, redirect to app subdomain
        const appUrl = getAppSubdomainUrl();
        window.location.href = appUrl;
      } finally {
        isLoading.value = false;
      }
    }

    async function logout(): Promise<void> {
      try {
        await authService.logout();
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        clearAuth();
        // Redirect to main domain login page
        window.location.href = '/login';
      }
    }

    async function checkAuth(): Promise<boolean> {
      // Prevent concurrent auth checks
      if (authCheckPromise.value) {
        return authCheckPromise.value;
      }

      authCheckPromise.value = (async () => {
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
          console.error('Auth check failed:', error);
          clearAuth();
          return false;
        } finally {
          authCheckPromise.value = null;
        }
      })();

      return authCheckPromise.value;
    }

    async function resendVerificationEmail(): Promise<void> {
      await authService.resendVerificationEmail();
    }

    function setUser(userData: User): void {
      user.value = userData;
      isAuthenticated.value = true;
    }

    function clearAuth(): void {
      user.value = null;
      isAuthenticated.value = false;
    }

    return {
      // State
      user,
      isAuthenticated,

      // Getters
      userName,

      // Actions
      register,
      login,
      logout,
      checkAuth,
      resendVerificationEmail,
      clearAuth,
    };
  },
  {
    persist: {
      storage: localStorage,
      pick: ['user', 'isAuthenticated'],
    },
  },
);
