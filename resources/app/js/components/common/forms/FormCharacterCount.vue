<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  current: number;
  max: number;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
});

const countClasses = computed(() => {
  const baseClasses = 'text-sm text-gray-500';
  return props.class ? `${baseClasses} ${props.class}` : baseClasses;
});

const isNearLimit = computed(() => props.current > props.max * 0.9);
const isOverLimit = computed(() => props.current > props.max);

const displayClasses = computed(() => {
  if (isOverLimit.value) return `${countClasses.value} text-red-600 font-medium`;
  if (isNearLimit.value) return `${countClasses.value} text-orange-600`;
  return countClasses.value;
});
</script>

<template>
  <small :class="displayClasses"> {{ props.current }}/{{ props.max }} characters </small>
</template>
