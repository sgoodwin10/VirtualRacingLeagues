<script setup lang="ts">
import { useSiteConfig } from '@public/composables/useSiteConfig';

const { isMaintenanceMode } = useSiteConfig();
</script>

<template>
  <div
    v-if="isMaintenanceMode"
    class="fixed top-0 left-0 right-0 z-50 bg-[var(--red)] text-white h-[20px] flex items-center justify-center shadow-lg"
  >
    <p class="text-[0.75rem] font-display tracking-wider uppercase font-medium">
      ⚠️ Site is in Maintenance Mode
    </p>
  </div>
</template>

<style scoped>
/* Ensure bar is above all other content */
</style>
