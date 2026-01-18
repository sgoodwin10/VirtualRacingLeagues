<script setup lang="ts">
/**
 * VrlListRowStat Component
 *
 * Displays a single statistic with value and label.
 * Uses Orbitron font for values with optional color variants.
 */
import { computed } from 'vue';
import type { VrlListRowStatProps } from './types';

const props = withDefaults(defineProps<VrlListRowStatProps>(), {
  valueColor: undefined,
  class: '',
});

const valueColorClass = computed(() => {
  if (!props.valueColor) return '';

  const colorClasses: Record<string, string> = {
    cyan: 'text-[var(--cyan)]',
    orange: 'text-[var(--orange)]',
    green: 'text-[var(--green)]',
    red: 'text-[var(--red)]',
    purple: 'text-[var(--purple)]',
  };

  return colorClasses[props.valueColor] || '';
});

const ariaLabel = computed(() => `${props.value} ${props.label}`);
</script>

<template>
  <div
    class="text-right"
    :class="props.class"
    role="group"
    :aria-label="ariaLabel"
    data-test="list-row-stat"
  >
    <div
      class="font-display text-[0.9rem] font-semibold"
      :class="valueColorClass"
      data-test="stat-value"
    >
      <slot name="value">{{ props.value }}</slot>
    </div>
    <div
      class="text-[0.7rem] text-[var(--text-muted)] uppercase tracking-[0.5px]"
      data-test="stat-label"
    >
      <slot name="label">{{ props.label }}</slot>
    </div>
  </div>
</template>
