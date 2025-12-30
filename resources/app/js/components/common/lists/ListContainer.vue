<script setup lang="ts">
/**
 * ListContainer Component
 *
 * Flex column container for list items.
 * Provides consistent spacing and ARIA semantics.
 */
import { computed } from 'vue';
import type { ListContainerProps } from './types';

const props = withDefaults(defineProps<ListContainerProps>(), {
  gap: '12px',
  class: '',
  ariaLabel: undefined,
});

const gapStyle = computed(() => {
  const gap = typeof props.gap === 'number' ? `${props.gap}px` : props.gap;
  return { gap };
});
</script>

<template>
  <div
    :class="['flex flex-col', props.class]"
    :style="gapStyle"
    role="list"
    :aria-label="props.ariaLabel"
  >
    <slot />
  </div>
</template>
