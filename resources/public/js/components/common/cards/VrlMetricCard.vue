<script setup lang="ts">
import { computed } from 'vue';
import type { VrlMetricCardProps } from './types';

const props = withDefaults(defineProps<VrlMetricCardProps>(), {
  accentColor: 'cyan',
  changeDirection: 'neutral',
});

const accentColorMap = {
  cyan: 'var(--cyan)',
  green: 'var(--green)',
  orange: 'var(--orange)',
  purple: 'var(--purple)',
};

const cardClasses = computed(() => {
  const classes = [
    'bg-[var(--bg-card)]',
    'border',
    'border-[var(--border)]',
    'rounded-[var(--radius-lg)]',
    'p-6',
    'relative',
    'overflow-hidden',
    'before:content-[""]',
    'before:absolute',
    'before:top-0',
    'before:left-0',
    'before:w-1',
    'before:h-full',
    `before:bg-[${accentColorMap[props.accentColor]}]`,
  ];
  if (props.class) {
    classes.push(props.class);
  }
  return classes.join(' ');
});

const labelClasses = computed(() => {
  return ['text-[0.8rem]', 'text-[var(--text-secondary)]', 'mb-2'].join(' ');
});

const valueClasses = computed(() => {
  return [
    'font-[var(--font-display)]',
    'text-[2rem]',
    'font-bold',
    'mb-1',
    `text-[${accentColorMap[props.accentColor]}]`,
  ].join(' ');
});

const iconClasses = computed(() => {
  return ['absolute', 'top-6', 'right-6', 'opacity-50'].join(' ');
});

const changeClasses = computed(() => {
  const classes = ['text-xs', 'flex', 'items-center', 'gap-1'];

  if (props.changeDirection === 'positive') {
    classes.push('text-[var(--green)]');
  } else if (props.changeDirection === 'negative') {
    classes.push('text-[var(--red)]');
  } else {
    classes.push('text-[var(--text-muted)]');
  }

  return classes.join(' ');
});

const ariaLabel = computed(() => `${props.label}: ${props.value}`);

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return props.value.toLocaleString();
  }
  return props.value;
});
</script>

<template>
  <div
    :class="cardClasses"
    role="region"
    :aria-label="ariaLabel"
    data-test="metric-card"
    :data-accent="accentColor"
  >
    <div :class="labelClasses" data-test="metric-label">
      <slot name="label">
        {{ label }}
      </slot>
    </div>

    <div :class="valueClasses" data-test="metric-value">
      <slot name="value">
        {{ formattedValue }}
      </slot>
    </div>

    <div v-if="icon || $slots.icon" :class="iconClasses" data-test="metric-icon">
      <slot name="icon">
        <component :is="icon" v-if="icon" />
      </slot>
    </div>

    <div
      v-if="change || $slots.change"
      :class="changeClasses"
      data-test="metric-change"
      :data-direction="changeDirection"
    >
      <slot name="change">
        {{ change }}
      </slot>
    </div>
  </div>
</template>
