<!--
  Example: Using the Site Configuration Store

  This example demonstrates how to access and use the site configuration
  store throughout the user dashboard application.
-->

<script setup lang="ts">
import { computed } from 'vue';
import { useSiteConfigStore } from '@user/stores/siteConfigStore';

const siteConfigStore = useSiteConfigStore();

// Access individual computed getters
const appName = computed(() => siteConfigStore.siteName);
const appDescription = computed(() => siteConfigStore.siteDescription);
const hasAnalytics = computed(() => !!siteConfigStore.googleAnalyticsId);

// Access custom configuration
const maxLeagues = computed(() => siteConfigStore.getCustomConfig<number>('maxLeagues', 1));

// Check if store is ready
const isConfigReady = computed(() => siteConfigStore.isReady);

// Refresh configuration (e.g., after user updates settings)
async function handleRefreshConfig() {
  await siteConfigStore.refreshConfig();
}
</script>

<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Site Configuration Example</h1>

    <!-- Loading state -->
    <div v-if="siteConfigStore.loading" class="text-gray-600">Loading configuration...</div>

    <!-- Error state -->
    <div v-else-if="siteConfigStore.error" class="text-red-600">
      Error: {{ siteConfigStore.error }}
    </div>

    <!-- Config loaded -->
    <div v-else-if="isConfigReady" class="space-y-2">
      <p><strong>Site Name:</strong> {{ appName }}</p>
      <p><strong>Description:</strong> {{ appDescription }}</p>
      <p><strong>Analytics Enabled:</strong> {{ hasAnalytics ? 'Yes' : 'No' }}</p>
      <p><strong>Max Leagues (Custom):</strong> {{ maxLeagues }}</p>

      <button
        type="button"
        class="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        @click="handleRefreshConfig"
      >
        Refresh Config
      </button>
    </div>
  </div>
</template>
