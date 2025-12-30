<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  /** Gap value (positive or negative) */
  value?: number | null | undefined;
  /** Number of decimal places */
  decimals?: number;
  /** Show + sign for positive values */
  showPlus?: boolean;
  /** Placeholder for leader (0 or null) */
  leaderPlaceholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  value: null,
  decimals: 0,
  showPlus: false,
  leaderPlaceholder: '—',
});

/**
 * Format gap value with sign
 */
const formattedValue = computed(() => {
  if (props.value === null || props.value === undefined || props.value === 0) {
    return props.leaderPlaceholder;
  }

  const formatted = Math.abs(props.value).toFixed(props.decimals);
  if (props.value > 0) {
    return props.showPlus ? `+${formatted}` : formatted;
  }
  return `-${formatted}`;
});

/**
 * Get CSS class based on value
 */
const gapClass = computed(() => {
  if (props.value === null || props.value === undefined || props.value === 0) {
    return 'gap-cell';
  }
  return props.value > 0 ? 'gap-cell positive' : 'gap-cell negative';
});
</script>

<template>
  <div :class="gapClass">
    {{ formattedValue }}
  </div>
</template>

<style scoped>
.gap-cell {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-secondary);
}

.gap-cell.negative {
  color: var(--red);
}

.gap-cell.positive {
  color: var(--green);
}
</style>
