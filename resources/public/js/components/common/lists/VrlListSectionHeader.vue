<script setup lang="ts">
/**
 * VrlListSectionHeader Component
 *
 * Section header with Orbitron typography and uppercase styling.
 * Used to divide list sections with clear visual hierarchy.
 */
import type { VrlListSectionHeaderProps } from './types';

const props = withDefaults(defineProps<VrlListSectionHeaderProps>(), {
  title: undefined,
  class: '',
});
</script>

<template>
  <div
    class="font-display text-[0.7rem] font-semibold text-[var(--text-muted)] tracking-[2px] uppercase py-3 mt-4"
    :class="props.class"
    role="separator"
    data-test="list-section-header"
  >
    <slot>{{ props.title }}</slot>
  </div>
</template>
