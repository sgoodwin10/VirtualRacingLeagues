<template>
  <header class="bg-white shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center py-6">
        <!-- Logo -->
        <div class="flex-shrink-0">
          <router-link to="/" class="text-2xl font-bold text-gray-900">
            {{ appName }}
          </router-link>
        </div>

        <!-- Navigation -->
        <nav class="hidden md:flex space-x-8">
          <router-link
            to="/"
            class="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            :class="{ 'text-gray-900': $route.name === 'home' }"
          >
            Home
          </router-link>
          <a
            href="#features"
            class="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
          >
            Features
          </a>
          <a
            href="#pricing"
            class="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
          >
            Pricing
          </a>
        </nav>

        <!-- Auth buttons / User menu -->
        <div class="flex items-center space-x-4">
          <!-- Show when NOT authenticated -->
          <template v-if="!authStore.isAuthenticated">
            <router-link
              to="/login"
              class="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Login
            </router-link>
            <router-link
              to="/register"
              class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Get Started
            </router-link>
          </template>

          <!-- Show when authenticated -->
          <template v-else>
            <div class="flex items-center space-x-4">
              <span class="text-gray-700 text-sm font-medium">
                Welcome, {{ authStore.userName }}
              </span>
              <a
                :href="appSubdomainUrl"
                class="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </a>
              <button
                :disabled="isLoggingOut"
                class="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                @click="handleLogout"
              >
                {{ isLoggingOut ? 'Logging out...' : 'Logout' }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAuthStore } from '@public/stores/authStore';

const authStore = useAuthStore();
const isLoggingOut = ref(false);

const appName = computed(() => {
  return import.meta.env.VITE_APP_NAME || 'Your App';
});

const appSubdomainUrl = computed(() => {
  // VITE_APP_DOMAIN already includes 'app.' prefix
  return `http://${import.meta.env.VITE_APP_DOMAIN}`;
});

const handleLogout = async (): Promise<void> => {
  if (isLoggingOut.value) return;

  isLoggingOut.value = true;
  try {
    await authStore.logout();
    // The logout action in authStore will handle the redirect
  } catch (error) {
    console.error('Logout failed:', error);
    isLoggingOut.value = false;
  }
};
</script>
