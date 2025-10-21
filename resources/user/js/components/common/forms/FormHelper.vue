<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  text?: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  text: undefined,
  class: '',
});

const helperClasses = computed(() => {
  const baseClasses = 'text-xs text-gray-500';
  return props.class ? `${baseClasses} ${props.class}` : baseClasses;
});
</script>

<template>
  <small v-if="props.text" :class="helperClasses">
    {{ props.text }}
  </small>
</template>
