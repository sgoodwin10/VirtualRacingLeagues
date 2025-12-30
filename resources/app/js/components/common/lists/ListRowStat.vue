<script setup lang="ts">
/**
 * ListRowStat Component
 *
 * Single statistic display with value and label.
 * Supports slots for custom rendering.
 */
import type { ListRowStatProps } from './types';

const props = withDefaults(defineProps<ListRowStatProps>(), {
  class: '',
});

const ariaLabel = `${props.value} ${props.label}`;
</script>

<template>
  <div :class="['flex flex-col gap-1', props.class]" role="group" :aria-label="ariaLabel">
    <div class="font-mono text-[16px] font-semibold text-[var(--text-primary)]">
      <slot name="value">
        {{ props.value }}
      </slot>
    </div>
    <div class="font-mono text-[9px] uppercase tracking-[1px] text-[var(--text-muted)]">
      <slot name="label">
        {{ props.label }}
      </slot>
    </div>
  </div>
</template>
