<script setup lang="ts">
/**
 * BackgroundGrid Component
 *
 * Fixed grid background overlay with animated grid pattern.
 * Used as a full-screen background effect for the landing page.
 */
</script>

<template>
  <div
    class="fixed inset-0 pointer-events-none z-0 bg-[length:40px_40px]"
    style="
      background-image:
        linear-gradient(rgba(88, 166, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(88, 166, 255, 0.03) 1px, transparent 1px);
    "
    aria-hidden="true"
  />
</template>
