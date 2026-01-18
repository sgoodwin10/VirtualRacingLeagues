<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
});

const groupClasses = computed(() => {
  const baseClasses = 'mb-6';
  return props.class ? `${baseClasses} ${props.class}` : baseClasses;
});
</script>

<template>
  <div :class="groupClasses">
    <slot></slot>
  </div>
</template>
