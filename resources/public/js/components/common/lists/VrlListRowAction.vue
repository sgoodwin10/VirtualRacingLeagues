<script setup lang="ts">
/**
 * VrlListRowAction Component
 *
 * Container for action buttons/icons that appear on row hover.
 * Hidden by default (opacity: 0), visible on parent row hover (opacity: 1).
 */
import type { VrlListRowActionProps } from './types';

const props = withDefaults(defineProps<VrlListRowActionProps>(), {
  class: '',
});
</script>

<template>
  <div
    class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0"
    :class="props.class"
    data-test="list-row-action"
  >
    <slot />
  </div>
</template>
