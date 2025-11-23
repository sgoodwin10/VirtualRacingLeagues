<script setup lang="ts">
import { computed } from 'vue';
import { useErrorBoundary } from '@app/composables/useErrorBoundary';

const { error, errorInfo, resetError } = useErrorBoundary();
const isDev = computed(() => import.meta.env.DEV);
</script>

<template>
  <div v-if="error" class="error-boundary p-6 bg-red-50 border border-red-200 rounded-lg">
    <h2 class="text-xl font-semibold text-red-800 mb-2">Something went wrong</h2>
    <p class="text-red-700 mb-4">{{ error.message }}</p>

    <details v-if="isDev" class="mb-4">
      <summary class="cursor-pointer text-red-600 hover:text-red-800">Show error details</summary>
      <div class="mt-2 p-3 bg-red-100 rounded text-sm font-mono">
        <div class="mb-2"><strong>Error:</strong> {{ error.message }}</div>
        <div v-if="errorInfo" class="mb-2"><strong>Component:</strong> {{ errorInfo }}</div>
        <div v-if="error.stack">
          <strong>Stack:</strong>
          <pre class="mt-1 whitespace-pre-wrap">{{ error.stack }}</pre>
        </div>
      </div>
    </details>

    <button
      class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
      @click="resetError"
    >
      Try again
    </button>
  </div>
  <slot v-else />
</template>
