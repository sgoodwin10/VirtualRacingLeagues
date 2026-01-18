<script setup lang="ts">
/**
 * VrlPointsCell - Display points value with Orbitron font
 *
 * Shows points value using Orbitron display font with bold weight.
 * Follows VRL Velocity design system typography.
 *
 * @example
 * ```vue
 * <VrlPointsCell :value="256" />
 * ```
 */
interface VrlPointsCellProps {
  /** Points value (required) */
  value: number;
}

defineProps<VrlPointsCellProps>();
</script>

<template>
  <div
    class="font-[family-name:var(--font-display)] font-bold text-[var(--text-primary)]"
    data-test="points-cell"
  >
    {{ value }}
  </div>
</template>
