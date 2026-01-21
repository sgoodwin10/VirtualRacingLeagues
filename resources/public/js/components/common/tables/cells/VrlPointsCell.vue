<script setup lang="ts">
/**
 * VrlPointsCell - Display points value with monospace font
 *
 * Shows points value using monospace font with bold weight.
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
    class="text-center font-[family-name:var(--font-mono)] font-bold text-[var(--text-primary)]"
    data-test="points-cell"
  >
    {{ value }}
  </div>
</template>
