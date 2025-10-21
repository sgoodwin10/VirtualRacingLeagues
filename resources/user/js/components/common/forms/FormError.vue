<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  error?: string | string[];
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  error: undefined,
  class: '',
});

const errorMessage = computed(() => {
  if (!props.error) return null;
  return Array.isArray(props.error) ? props.error[0] : props.error;
});

const errorClasses = computed(() => {
  const baseClasses = 'text-sm text-red-500 mt-1';
  return props.class ? `${baseClasses} ${props.class}` : baseClasses;
});
</script>

<template>
  <small v-if="errorMessage" :class="errorClasses">
    {{ errorMessage }}
  </small>
</template>
