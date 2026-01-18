<script setup lang="ts">
import { useAuthStore } from '@public/stores/authStore';

const authStore = useAuthStore();
</script>

<template>
  <header class="bg-[var(--bg-panel)] border-b border-[var(--border)]">
    <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo -->
        <div class="flex-shrink-0">
          <router-link
            to="/"
            class="text-xl font-semibold text-[var(--text-primary)] font-[var(--font-display)] hover:text-[var(--cyan)] transition-colors"
          >
            {{ $appName || 'App' }}
          </router-link>
        </div>

        <!-- Navigation Links -->
        <div class="flex items-center space-x-4">
          <template v-if="!authStore.isAuthenticated">
            <router-link
              to="/login"
              class="text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-3 py-2 text-sm font-medium transition-colors"
            >
              Login
            </router-link>
            <router-link
              to="/register"
              class="bg-[var(--cyan)] text-[var(--bg-dark)] hover:bg-[var(--cyan)]/90 px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              Sign Up
            </router-link>
          </template>
        </div>
      </div>
    </nav>
  </header>
</template>
