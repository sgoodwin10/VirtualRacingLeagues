<script setup lang="ts">
/**
 * ListRowIndicator Component
 *
 * Vertical status bar that displays the status of a list item.
 * Shows different colors based on status with optional glow effect.
 */
import { computed } from 'vue';
import type { ListRowIndicatorProps } from './types';

const props = withDefaults(defineProps<ListRowIndicatorProps>(), {
  height: '40px',
  width: '4px',
  class: '',
});

const sizeStyle = computed(() => {
  const height = typeof props.height === 'number' ? `${props.height}px` : props.height;
  const width = typeof props.width === 'number' ? `${props.width}px` : props.width;
  return {
    height,
    width,
    minWidth: width,
  };
});

const colorClasses = computed(() => {
  switch (props.status) {
    case 'active':
      return 'bg-[var(--green)] shadow-[0_0_8px_var(--green)]';
    case 'upcoming':
      return 'bg-[var(--cyan)]';
    case 'completed':
      return 'bg-[var(--text-muted)]';
    case 'pending':
      return 'bg-[var(--orange)]';
    case 'inactive':
      return 'bg-[var(--border)]';
    default:
      return 'bg-[var(--border)]';
  }
});

const ariaLabel = computed(() => `Status: ${props.status}`);
</script>

<template>
  <div
    :class="['rounded-full', colorClasses, props.class]"
    :style="sizeStyle"
    role="status"
    :aria-label="ariaLabel"
  ></div>
</template>
