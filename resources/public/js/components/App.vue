<template>
  <div id="app" class="min-h-screen flex flex-col">
    <!-- Maintenance Mode Page (blocks access when enabled) -->
    <MaintenanceModePage v-if="isMaintenanceMode" />

    <!-- Normal App Content -->
    <template v-else>
      <LandingNav v-if="!isWhiteLabel" />
      <main class="flex-1 flex flex-col">
        <router-view />
      </main>
      <PublicFooter v-if="!isWhiteLabel" />
    </template>

    <Toast />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import LandingNav from '@public/components/landing/LandingNav.vue';
import PublicFooter from '@public/components/layout/PublicFooter.vue';
import MaintenanceModePage from '@public/components/maintenance/MaintenanceModePage.vue';
import Toast from 'primevue/toast';
import { useAuthStore } from '@public/stores/authStore';
import { useSiteConfig } from '@public/composables/useSiteConfig';

const route = useRoute();
const authStore = useAuthStore();
const { isMaintenanceMode } = useSiteConfig();

// Check if white label mode is active
const isWhiteLabel = computed(() => route.query.whitelabel === 'true');

// Check authentication status when the app mounts
onMounted(async () => {
  await authStore.checkAuth();
});
</script>
