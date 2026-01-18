<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
});

const helperClasses = computed(() => {
  const baseClasses = 'text-xs text-[var(--text-muted)] mt-2 block';
  return props.class ? `${baseClasses} ${props.class}` : baseClasses;
});
</script>

<template>
  <small :class="helperClasses">
    <slot></slot>
  </small>
</template>
