<script setup lang="ts">
/**
 * VrlListRowContent Component
 *
 * Displays title and subtitle content for a list row.
 * Provides flexible content display with slot support.
 */
import type { VrlListRowContentProps } from './types';

const props = withDefaults(defineProps<VrlListRowContentProps>(), {
  subtitle: undefined,
  class: '',
});
</script>

<template>
  <div class="flex-1 min-w-0" :class="props.class" data-test="list-row-content">
    <div class="font-medium mb-1 max-sm:text-sm" data-test="list-row-title">
      <slot name="title">{{ props.title }}</slot>
    </div>
    <div
      v-if="props.subtitle || $slots.subtitle"
      class="text-[0.8rem] text-[var(--text-secondary)] max-sm:text-xs"
      data-test="list-row-subtitle"
    >
      <slot name="subtitle">{{ props.subtitle }}</slot>
    </div>
  </div>
</template>
