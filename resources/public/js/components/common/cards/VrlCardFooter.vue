<script setup lang="ts">
import { computed } from 'vue';
import type { VrlCardFooterProps } from './types';

const props = defineProps<VrlCardFooterProps>();

const footerClasses = computed(() => {
  const classes = ['px-6', 'py-4', 'border-t', 'border-[var(--border)]', 'bg-[var(--bg-panel)]'];
  if (props.class) {
    classes.push(props.class);
  }
  return classes.join(' ');
});
</script>

<template>
  <div :class="footerClasses" data-test="card-footer">
    <slot />
  </div>
</template>
