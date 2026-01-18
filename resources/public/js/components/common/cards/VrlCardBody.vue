<script setup lang="ts">
import { computed } from 'vue';
import type { VrlCardBodyProps } from './types';

const props = withDefaults(defineProps<VrlCardBodyProps>(), {
  noPadding: false,
});

const bodyClasses = computed(() => {
  const classes = [];
  if (!props.noPadding) {
    classes.push('p-6');
  }
  if (props.class) {
    classes.push(props.class);
  }
  return classes.join(' ');
});
</script>

<template>
  <div :class="bodyClasses" data-test="card-body" :data-padded="!noPadding">
    <slot />
  </div>
</template>
