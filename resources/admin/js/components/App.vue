<template>
  <Toast />
  <router-view v-if="!hasError" />
  <div v-else class="error-boundary">
    <div class="error-boundary-content">
      <i class="pi pi-exclamation-triangle text-6xl text-red-500 mb-4"></i>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
      <p class="text-gray-600 mb-6">{{ errorMessage }}</p>
      <button
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        @click="handleReload"
      >
        Reload Application
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue';
import Toast from 'primevue/toast';
import { logger } from '@admin/utils/logger';

// Error boundary state
const hasError = ref(false);
const errorMessage = ref('An unexpected error occurred. Please try reloading the page.');

/**
 * Global error handler for child component errors
 * Catches errors from any child component and displays error boundary
 */
onErrorCaptured((err, instance, info) => {
  // Log error details for debugging
  logger.error('Component error caught by error boundary:', {
    error: err,
    componentName: instance?.$options?.name || 'Unknown',
    errorInfo: info,
  });

  // Set error state to show error boundary
  hasError.value = true;
  errorMessage.value = err instanceof Error ? err.message : String(err);

  // Return false to stop error propagation
  // This prevents the error from being logged multiple times
  return false;
});

/**
 * Handle reload button click
 * Reloads the entire application
 */
const handleReload = (): void => {
  window.location.reload();
};
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(to bottom right, #f9fafb, #f3f4f6);
}

.error-boundary-content {
  text-align: center;
  max-width: 500px;
}
</style>
