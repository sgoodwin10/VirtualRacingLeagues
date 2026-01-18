<script setup lang="ts">
/**
 * PlatformCard Component
 *
 * Single platform card displaying icon and platform name.
 * Features hover effect with border color change.
 */

interface PlatformCardProps {
  /** Platform icon (emoji) */
  icon: string;
  /** Platform name */
  name: string;
}

defineProps<PlatformCardProps>();
</script>

<template>
  <div
    class="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl px-12 py-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[var(--cyan)]"
  >
    <div class="text-5xl mb-4" aria-hidden="true">{{ icon }}</div>
    <div class="font-[var(--font-display)] text-[1.2rem] font-semibold tracking-[1px]">
      {{ name }}
    </div>
  </div>
</template>
