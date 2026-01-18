<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  for?: string;
  required?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  for: undefined,
  required: false,
  class: '',
});

const labelClasses = computed(() => {
  const baseClasses =
    'block font-display text-xs font-semibold tracking-wide mb-2 text-[var(--text-secondary)]';
  return props.class ? `${baseClasses} ${props.class}` : baseClasses;
});
</script>

<template>
  <label :for="props.for" :class="labelClasses">
    <slot></slot>
    <span v-if="props.required" class="text-[var(--red)] ml-1">*</span>
  </label>
</template>
