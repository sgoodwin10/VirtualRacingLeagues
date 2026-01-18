<script setup lang="ts">
import { computed } from 'vue';
import type { VrlCardProps } from './types';

const props = withDefaults(defineProps<VrlCardProps>(), {
  hoverable: false,
  bodyPadding: true,
});

const showHeaderComputed = computed(() => {
  if (props.showHeader !== undefined) {
    return props.showHeader;
  }
  return !!props.title;
});

const cardClasses = computed(() => {
  const classes = [
    'bg-[var(--bg-card)]',
    'border',
    'border-[var(--border)]',
    'rounded-[var(--radius-lg)]',
    'overflow-hidden',
    'transition-all',
    'duration-300',
    'ease-in-out',
  ];

  if (props.hoverable) {
    classes.push('hover:border-[var(--cyan)]', 'hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)]');
  }

  if (props.class) {
    classes.push(props.class);
  }

  return classes.join(' ');
});

const headerClasses = computed(() => {
  return [
    'px-6',
    'py-5',
    'border-b',
    'border-[var(--border)]',
    'flex',
    'items-center',
    'justify-between',
  ].join(' ');
});

const bodyClasses = computed(() => {
  const classes = [];
  if (props.bodyPadding) {
    classes.push('p-6');
  }
  return classes.join(' ');
});

const footerClasses = computed(() => {
  return ['px-6', 'py-4', 'border-t', 'border-[var(--border)]', 'bg-[var(--bg-panel)]'].join(' ');
});

const titleClasses = computed(() => {
  return ['font-[var(--font-display)]', 'text-base', 'font-semibold', 'tracking-[0.5px]'].join(' ');
});

const actionsClasses = computed(() => {
  return ['flex', 'items-center', 'gap-2'].join(' ');
});

const ariaLabel = computed(() => props.title || 'Card');
</script>

<template>
  <div :class="cardClasses" role="region" :aria-label="ariaLabel" data-test="card">
    <div
      v-if="showHeaderComputed || $slots.header || $slots.actions"
      :class="headerClasses"
      data-test="card-header"
    >
      <slot name="header">
        <h3 v-if="title" :class="titleClasses" data-test="card-title">{{ title }}</h3>
      </slot>
      <div
        v-if="$slots.actions && !$slots.header"
        :class="actionsClasses"
        data-test="card-header-actions"
      >
        <slot name="actions" />
      </div>
    </div>

    <div :class="bodyClasses" data-test="card-body" :data-padded="bodyPadding">
      <slot name="body">
        <slot />
      </slot>
    </div>

    <div v-if="$slots.footer" :class="footerClasses" data-test="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>
