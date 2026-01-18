<script setup lang="ts">
import { computed } from 'vue';
import type { Position } from '@public/types/components';
import { isValidPosition } from '@public/types/components';

interface VrlPositionIndicatorProps {
  /**
   * Racing position number (1, 2, 3, etc.)
   * @required
   */
  position: Position;
}

const props = defineProps<VrlPositionIndicatorProps>();

// Development warning for invalid positions
if (import.meta.env.DEV && !isValidPosition(props.position)) {
  console.warn(
    `VrlPositionIndicator: position must be a positive integer, received ${props.position}`,
  );
}

/**
 * Compute position-specific variant classes
 */
const variantClasses = computed(() => {
  if (props.position === 1) {
    return 'bg-[var(--yellow-dim)] text-[var(--yellow)]';
  }
  if (props.position === 2) {
    return 'bg-[rgba(192,192,192,0.15)] text-[#c0c0c0]';
  }
  if (props.position === 3) {
    return 'bg-[rgba(205,127,50,0.15)] text-[#cd7f32]';
  }
  return 'bg-[var(--bg-elevated)] text-[var(--text-primary)]';
});
</script>

<template>
  <span
    :class="[
      'inline-flex items-center justify-center min-w-8 w-8 h-8 font-[var(--font-display)] font-bold text-[0.9rem] rounded-[var(--radius)] px-1 leading-none',
      variantClasses,
    ]"
  >
    {{ position }}
  </span>
</template>
