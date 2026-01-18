<script setup lang="ts">
import { computed } from 'vue';
import type { VrlFeatureCardProps } from './types';

const props = defineProps<VrlFeatureCardProps>();

const cardClasses = computed(() => {
  const classes = [
    'bg-[var(--bg-card)]',
    'border',
    'border-[var(--border)]',
    'rounded-[var(--radius-lg)]',
    'p-8',
    'transition-all',
    'duration-300',
    'ease-in-out',
    'relative',
    'overflow-hidden',
    'hover:-translate-y-1',
    'hover:border-[var(--cyan)]',
    'hover:shadow-[0_20px_40px_rgba(88,166,255,0.1)]',
    'before:content-[""]',
    'before:absolute',
    'before:top-0',
    'before:left-0',
    'before:right-0',
    'before:h-[3px]',
    'before:bg-gradient-to-r',
    'before:from-[var(--cyan)]',
    'before:to-[var(--purple)]',
    'before:scale-x-0',
    'before:transition-transform',
    'before:duration-300',
    'before:ease-in-out',
    'hover:before:scale-x-100',
  ];
  if (props.class) {
    classes.push(props.class);
  }
  return classes.join(' ');
});

const iconClasses = computed(() => {
  return [
    'w-[60px]',
    'h-[60px]',
    'bg-[var(--cyan-dim)]',
    'rounded-[var(--radius-lg)]',
    'flex',
    'items-center',
    'justify-center',
    'mb-6',
    'text-2xl',
  ].join(' ');
});

const titleClasses = computed(() => {
  return [
    'font-[var(--font-display)]',
    'text-[1.1rem]',
    'font-semibold',
    'mb-3',
    'tracking-[0.5px]',
  ].join(' ');
});

const descriptionClasses = computed(() => {
  return ['text-[var(--text-secondary)]', 'text-[0.9rem]', 'leading-[1.7]'].join(' ');
});
</script>

<template>
  <div :class="cardClasses" data-test="feature-card">
    <div :class="iconClasses" data-test="feature-icon">
      <slot name="icon">
        <component :is="icon" v-if="icon" />
        <span v-else-if="iconText">{{ iconText }}</span>
      </slot>
    </div>

    <h3 :class="titleClasses" data-test="feature-title">
      <slot name="title">
        {{ title }}
      </slot>
    </h3>

    <p :class="descriptionClasses" data-test="feature-desc">
      <slot name="description">
        {{ description }}
      </slot>
    </p>

    <slot />
  </div>
</template>
