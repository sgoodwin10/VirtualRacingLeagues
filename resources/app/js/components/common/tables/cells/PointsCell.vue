<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  /** Points value */
  value?: number | null | undefined;
  /** Points value (alias for value) */
  points?: number | null | undefined;
  /** Number of decimal places */
  decimals?: number;
  /** Placeholder for null/undefined */
  placeholder?: string;
  /** Apply bold font weight */
  bold?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  value: null,
  points: undefined,
  decimals: 0,
  placeholder: '—',
  bold: false,
});

/**
 * Get the points value from either value or points prop
 */
const pointsValue = computed(() => {
  // Use points prop if provided, otherwise fall back to value prop
  return props.points !== undefined ? props.points : props.value;
});

/**
 * Format points value
 */
function formatValue(value: number | null | undefined): string {
  if (value === null || value === undefined) return props.placeholder;

  // If decimals prop was explicitly set (non-zero), use it for precise formatting
  if (props.decimals > 0) {
    return value.toFixed(props.decimals);
  }

  // Auto-detect formatting: Check if the value is a whole number
  const isWholeNumber = value % 1 === 0;

  if (isWholeNumber) {
    // Display whole numbers without decimals
    return value.toFixed(0);
  }

  // For decimal numbers, use toFixed with up to 2 decimal places to handle precision
  const formatted = value.toFixed(2);

  // Remove unnecessary trailing zeros (e.g., "25.50" -> "25.5", "25.10" -> "25.1")
  return formatted.replace(/\.?0+$/, '');
}
</script>

<template>
  <div class="points-cell" :class="{ 'points-cell--bold': bold }">
    {{ formatValue(pointsValue) }}
  </div>
</template>

<style scoped>
.points-cell {
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}

.points-cell--bold {
  font-weight: 700;
}
</style>
