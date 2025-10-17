import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@user/types/user';
import type { LoginCredentials } from '@user/types/auth';
import { authService } from '@user/services/authService';

export const useUserStore = defineStore(
  'user',
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
    const userFirstName = computed((): string => user.value?.first_name || '');
    const userLastName = computed((): string => user.value?.last_name || '');
    const userEmail = computed((): string => user.value?.email || '');
    const isEmailVerified = computed((): boolean => user.value?.email_verified_at !== null);

    // Helper function to get public site domain
    const getPublicDomain = (): string => {
      // Extract domain without 'app.' subdomain
      return import.meta.env.VITE_APP_URL.replace('//app.', '//');
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
        console.error('Logout error:', error);
      } finally {
        clearAuth();
        // Redirect to public site login page with logout flag to clear public auth store
        const publicDomain = getPublicDomain();
        window.location.href = `${publicDomain}/login?logout=1`;
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
      pick: ['user', 'isAuthenticated'],
    },
  }
);
