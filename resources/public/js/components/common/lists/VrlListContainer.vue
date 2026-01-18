<script setup lang="ts">
/**
 * VrlListContainer Component
 *
 * Generic flex column container for list items with consistent gap spacing.
 * Provides semantic list structure with ARIA support.
 */
import { computed } from 'vue';
import type { VrlListContainerProps } from './types';

const props = withDefaults(defineProps<VrlListContainerProps>(), {
  gap: '0.5rem',
  class: '',
  ariaLabel: undefined,
});

const gapValue = computed(() => {
  return typeof props.gap === 'number' ? `${props.gap}px` : props.gap;
});
</script>

<template>
  <div
    class="flex flex-col gap-2"
    :class="props.class"
    role="list"
    :aria-label="props.ariaLabel"
    :style="{ gap: gapValue }"
    data-test="list-container"
  >
    <slot />
  </div>
</template>
