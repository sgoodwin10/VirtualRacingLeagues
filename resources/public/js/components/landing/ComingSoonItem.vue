<script setup lang="ts">
/**
 * ComingSoonItem Component
 *
 * Dashed border item with hover effect for upcoming features.
 * Opacity increases and border becomes solid on hover.
 */

interface ComingSoonItemProps {
  /** Feature icon (emoji) */
  icon: string;
  /** Feature text */
  text: string;
}

defineProps<ComingSoonItemProps>();
</script>

<template>
  <div
    class="bg-[var(--bg-card)] border border-dashed border-[var(--border)] rounded-[var(--radius-lg)] p-6 text-center opacity-70 transition-all duration-300 hover:opacity-100 hover:border-solid hover:border-[var(--purple)]"
  >
    <div class="text-3xl mb-3" aria-hidden="true">{{ icon }}</div>
    <div class="text-[0.85rem] text-[var(--text-secondary)]">{{ text }}</div>
  </div>
</template>
