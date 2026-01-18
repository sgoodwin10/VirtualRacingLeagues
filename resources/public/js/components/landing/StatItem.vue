<script setup lang="ts">
/**
 * StatItem Component
 *
 * Displays a single statistic with value and label (e.g., "500+ Active Leagues").
 * Used in the hero section to showcase platform metrics.
 */

interface StatItemProps {
  /** Stat value (e.g., "500+", "10K+") */
  value: string;
  /** Stat label (e.g., "Active Leagues") */
  label: string;
}

defineProps<StatItemProps>();
</script>

<template>
  <div class="text-left">
    <div class="font-[var(--font-display)] text-[2.5rem] font-bold text-[var(--cyan)]">
      {{ value }}
    </div>
    <div class="text-[0.85rem] text-[var(--text-muted)] uppercase tracking-[1px]">
      {{ label }}
    </div>
  </div>
</template>
