<script setup lang="ts">
import { computed } from 'vue';
import type { VrlCardHeaderProps } from './types';

const props = defineProps<VrlCardHeaderProps>();

const headerClasses = computed(() => {
  const classes = [
    'px-6',
    'py-5',
    'border-b',
    'border-[var(--border)]',
    'flex',
    'items-center',
    'justify-between',
  ];
  if (props.class) {
    classes.push(props.class);
  }
  return classes.join(' ');
});

const titleClasses = computed(() => {
  return ['font-[var(--font-display)]', 'text-base', 'font-semibold', 'tracking-[0.5px]'].join(' ');
});

const actionsClasses = computed(() => {
  return ['flex', 'items-center', 'gap-2'].join(' ');
});
</script>

<template>
  <div :class="headerClasses" data-test="card-header">
    <slot>
      <h3 v-if="title" :class="titleClasses" data-test="card-title">{{ title }}</h3>
    </slot>
    <div v-if="$slots.actions" :class="actionsClasses" data-test="card-header-actions">
      <slot name="actions" />
    </div>
  </div>
</template>
