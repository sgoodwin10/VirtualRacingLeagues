<template>
  <div id="app" class="min-h-screen flex flex-col">
    <LandingNav v-if="!isWhiteLabel" />
    <main class="flex-1 flex flex-col">
      <router-view />
    </main>
    <PublicFooter v-if="!isWhiteLabel" />
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import LandingNav from '@public/components/landing/LandingNav.vue';
import PublicFooter from '@public/components/layout/PublicFooter.vue';
import Toast from 'primevue/toast';
import { useAuthStore } from '@public/stores/authStore';

const route = useRoute();
const authStore = useAuthStore();

// Check if white label mode is active
const isWhiteLabel = computed(() => route.query.whitelabel === 'true');

// Check authentication status when the app mounts
onMounted(async () => {
  await authStore.checkAuth();
});
</script>
