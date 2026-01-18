<script setup lang="ts">
import { computed } from 'vue';

/**
 * VrlPositionCell - Display position number with podium styling
 *
 * Shows position number with color coding for podium positions (1st, 2nd, 3rd).
 * Uses Orbitron font and VRL Velocity colors.
 *
 * @example
 * ```vue
 * <VrlPositionCell :position="1" />
 * ```
 */
interface VrlPositionCellProps {
  /** Position number (required) */
  position: number;
}

const props = defineProps<VrlPositionCellProps>();

/**
 * Get position indicator class based on position
 */
const positionClass = computed(() => {
  const classes = [
    'inline-flex',
    'items-center',
    'justify-center',
    'font-[family-name:var(--font-display)]',
    'text-[0.9rem]',
    'font-semibold',
    'min-w-[24px]',
  ];

  // Add podium-specific colors
  if (props.position === 1) {
    classes.push('text-[var(--yellow)]');
  } else if (props.position === 2) {
    classes.push('text-[var(--text-secondary)]');
  } else if (props.position === 3) {
    classes.push('text-[var(--orange)]');
  } else {
    classes.push('text-[var(--text-secondary)]');
  }

  return classes.join(' ');
});
</script>

<template>
  <span :class="positionClass" data-test="position-cell">
    {{ position }}
  </span>
</template>
