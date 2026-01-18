<script setup lang="ts">
import { computed } from 'vue';
import type { VrlInfoBoxProps } from './types';

const props = withDefaults(defineProps<VrlInfoBoxProps>(), {
  type: 'info',
});

const borderColorMap = {
  info: 'var(--cyan)',
  success: 'var(--green)',
  warning: 'var(--orange)',
  danger: 'var(--red)',
};

const textColorMap = {
  info: 'text-[var(--cyan)]',
  success: 'text-[var(--green)]',
  warning: 'text-[var(--orange)]',
  danger: 'text-[var(--red)]',
};

const infoBoxClasses = computed(() => {
  const classes = [
    'px-5',
    'py-4',
    'rounded-[var(--radius)]',
    'bg-[var(--bg-elevated)]',
    'border-l-[3px]',
    `border-l-[${borderColorMap[props.type]}]`,
  ];
  if (props.class) {
    classes.push(props.class);
  }
  return classes.join(' ');
});

const titleClasses = computed(() => {
  return [
    'font-[var(--font-display)]',
    'text-[0.85rem]',
    'font-semibold',
    'mb-1',
    textColorMap[props.type],
  ].join(' ');
});

const messageClasses = computed(() => {
  return ['text-[0.85rem]', 'text-[var(--text-secondary)]'].join(' ');
});
</script>

<template>
  <div
    :class="infoBoxClasses"
    role="note"
    :aria-label="title"
    data-test="info-box"
    :data-type="type"
  >
    <div :class="titleClasses" data-test="info-box-title">
      <slot name="title">
        {{ title }}
      </slot>
    </div>
    <div v-if="message || $slots.default" :class="messageClasses" data-test="info-box-message">
      <slot>
        {{ message }}
      </slot>
    </div>
  </div>
</template>
