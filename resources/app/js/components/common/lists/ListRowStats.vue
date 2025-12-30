<script setup lang="ts">
/**
 * ListRowStats Component
 *
 * Container for ListRowStat components.
 * Provides consistent spacing between statistics.
 */
import { computed } from 'vue';
import type { ListRowStatsProps } from './types';

const props = withDefaults(defineProps<ListRowStatsProps>(), {
  gap: '24px',
  class: '',
});

const gapStyle = computed(() => {
  const gap = typeof props.gap === 'number' ? `${props.gap}px` : props.gap;
  return { gap };
});
</script>

<template>
  <div
    :class="['flex items-center', props.class]"
    :style="gapStyle"
    role="group"
    aria-label="Statistics"
  >
    <slot />
  </div>
</template>
