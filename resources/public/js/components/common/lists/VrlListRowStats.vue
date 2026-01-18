<script setup lang="ts">
/**
 * VrlListRowStats Component
 *
 * Container for multiple VrlListRowStat components with consistent spacing.
 * Provides grouped presentation of statistics.
 */
import { computed } from 'vue';
import type { VrlListRowStatsProps } from './types';

const props = withDefaults(defineProps<VrlListRowStatsProps>(), {
  gap: '1.5rem',
  class: '',
});

const gapValue = computed(() => {
  return typeof props.gap === 'number' ? `${props.gap}px` : props.gap;
});
</script>

<template>
  <div
    class="flex gap-6 shrink-0 max-md:hidden"
    :class="props.class"
    role="group"
    aria-label="Statistics"
    :style="{ gap: gapValue }"
    data-test="list-row-stats"
  >
    <slot />
  </div>
</template>
