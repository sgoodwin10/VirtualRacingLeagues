<template>
  <div id="app" class="min-h-screen flex flex-col">
    <PublicHeader />
    <main class="flex-1">
      <router-view />
    </main>
    <PublicFooter />
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import PublicHeader from '@public/components/layout/PublicHeader.vue';
import PublicFooter from '@public/components/layout/PublicFooter.vue';
import Toast from 'primevue/toast';
import { useAuthStore } from '@public/stores/authStore';

const authStore = useAuthStore();

// Check authentication status when the app mounts
onMounted(async () => {
  await authStore.checkAuth();
});
</script>
