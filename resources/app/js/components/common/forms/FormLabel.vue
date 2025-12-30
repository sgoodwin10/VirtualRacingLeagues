<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  for?: string;
  required?: boolean;
  text: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  for: undefined,
  required: false,
  class: '',
});

const labelClasses = computed(() => {
  const baseClasses = 'block text-form-label mb-2';
  return props.class ? `${baseClasses} ${props.class}` : baseClasses;
});
</script>

<template>
  <label :for="props.for" :class="labelClasses">
    {{ props.text }}
    <span v-if="props.required" class="text-red-500">*</span>
  </label>
</template>
