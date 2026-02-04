<script setup lang="ts">
import { useSiteConfig } from '@app/composables/useSiteConfig';

const { maintenanceMessage } = useSiteConfig();
</script>

<template>
  <div
    class="fixed top-0 left-0 right-0 h-5 bg-[var(--red)] text-white z-[9999] flex items-center justify-center"
  >
    <p class="text-[0.75rem] font-display font-medium tracking-wider uppercase">
      Site is in maintenance mode: {{ maintenanceMessage }}
    </p>
  </div>
</template>

<style scoped>
/* Ensure the bar is always on top */
div {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
