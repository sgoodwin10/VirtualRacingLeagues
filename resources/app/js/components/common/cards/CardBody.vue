<script setup lang="ts">
import type { CardBodyProps } from './types';

const props = withDefaults(defineProps<CardBodyProps>(), {
  noPadding: false,
});
</script>

<template>
  <div :class="[noPadding ? 'p-0' : 'p-[18px]', props.class]">
    <slot />
  </div>
</template>
