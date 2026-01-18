<script setup lang="ts">
/**
 * VrlListRowIndicator Component
 *
 * Vertical colored status bar that indicates item status (active, pending, inactive).
 * Shows different colors based on status type.
 */
import { computed } from 'vue';
import type { VrlListRowIndicatorProps } from './types';

const props = withDefaults(defineProps<VrlListRowIndicatorProps>(), {
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
  };
});

const statusClass = computed(() => {
  const statusClasses: Record<string, string> = {
    active: 'bg-[var(--green)]',
    pending: 'bg-[var(--orange)]',
    inactive: 'bg-[var(--text-muted)]',
  };
  return statusClasses[props.status] || 'bg-[var(--border)]';
});

const ariaLabel = computed(() => `Status: ${props.status}`);
</script>

<template>
  <div
    class="w-1 h-10 rounded-[2px] bg-[var(--border)] shrink-0 max-sm:h-8 max-sm:w-[3px]"
    :class="[statusClass, props.class]"
    :style="sizeStyle"
    role="status"
    :aria-label="ariaLabel"
    data-test="list-row-indicator"
    :data-status="props.status"
  />
</template>
