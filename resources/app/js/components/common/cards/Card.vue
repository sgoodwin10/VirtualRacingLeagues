<script setup lang="ts">
import { computed } from 'vue';
import type { CardProps } from './types';

const props = withDefaults(defineProps<CardProps>(), {
  showHeader: undefined,
});

/**
 * Determine if header should be shown
 * Show if title is provided OR showHeader is explicitly true
 */
const shouldShowHeader = computed(() => {
  if (props.showHeader !== undefined) {
    return props.showHeader;
  }
  return !!props.title;
});
</script>

<template>
  <div
    :class="[
      'bg-card border border-[var(--border)] rounded-[var(--radius)] overflow-hidden',
      props.class,
    ]"
    role="region"
    :aria-label="title || 'Card'"
  >
    <!-- Header Slot -->
    <div
      v-if="shouldShowHeader || $slots.header || $slots.actions"
      class="flex items-center justify-between px-[18px] py-[14px] border-b border-[var(--border)] bg-elevated"
    >
      <!-- Header Content -->
      <div>
        <slot name="header">
          <span
            v-if="title"
            class="font-mono text-sm font-semibold tracking-wide text-[var(--text-primary)]"
          >
            {{ title }}
          </span>
        </slot>
      </div>

      <!-- Header Actions -->
      <div v-if="$slots.actions">
        <slot name="actions" />
      </div>
    </div>

    <!-- Body Slot -->
    <div class="p-[18px]">
      <slot name="body">
        <slot />
      </slot>
    </div>
  </div>
</template>
