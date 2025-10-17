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
