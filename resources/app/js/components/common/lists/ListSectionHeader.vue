<script setup lang="ts">
/**
 * ListSectionHeader Component
 *
 * Section header with uppercase monospace title and extending horizontal line.
 * Used to divide sections within lists.
 */
import type { ListSectionHeaderProps } from './types';

const props = withDefaults(defineProps<ListSectionHeaderProps>(), {
  class: '',
});
</script>

<template>
  <div
    :class="['flex items-center gap-3', props.class]"
    role="separator"
    aria-label="Section divider"
  >
    <span
      class="font-mono text-[11px] font-semibold tracking-[1px] uppercase text-[var(--text-muted)] whitespace-nowrap"
    >
      {{ props.title }}
    </span>
    <div class="flex-1 h-px bg-[var(--border)]"></div>
  </div>
</template>
