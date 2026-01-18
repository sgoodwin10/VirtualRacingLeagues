<script setup lang="ts">
import { computed } from 'vue';

/**
 * VrlGapCell - Display gap to leader with special formatting
 *
 * Shows "—" for leader (null/0 value), negative format for gaps behind leader.
 * Uses Orbitron font for consistency.
 *
 * @example
 * ```vue
 * <VrlGapCell :value="null" />  <!-- Shows "—" for leader -->
 * <VrlGapCell :value="-13" />   <!-- Shows "-13" -->
 * ```
 */
interface VrlGapCellProps {
  /** Gap value (null for leader, negative for gap behind) */
  value: number | string | null;
}

const props = defineProps<VrlGapCellProps>();

/**
 * Format gap display
 */
const formattedGap = computed(() => {
  // Leader indicator
  if (props.value === null || props.value === 0 || props.value === '0') {
    return '—';
  }

  // Convert to number if string
  const numValue = typeof props.value === 'string' ? parseFloat(props.value) : props.value;

  // Return as-is if already negative, otherwise add minus sign
  return numValue < 0 ? numValue.toString() : `-${numValue}`;
});
</script>

<template>
  <div
    class="font-[family-name:var(--font-display)] text-[0.85rem] text-[var(--text-secondary)]"
    data-test="gap-cell"
  >
    {{ formattedGap }}
  </div>
</template>
