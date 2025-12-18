<template>
  <div id="app">
    <PublicHeader />
    <main>
      <router-view />
    </main>
    <PublicFooter />
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';
import PublicHeader from '@public/components/layout/PublicHeader.vue';
import PublicFooter from '@public/components/layout/PublicFooter.vue';
import Toast from 'primevue/toast';
import { useAuthStore } from '@public/stores/authStore';
import { cleanupTheme } from '@public/composables/useTheme';

const authStore = useAuthStore();

// Check authentication status when the app mounts
onMounted(async () => {
  await authStore.checkAuth();
});

// Cleanup theme listener when the app is destroyed
onBeforeUnmount(() => {
  cleanupTheme();
});
</script>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}
</style>
