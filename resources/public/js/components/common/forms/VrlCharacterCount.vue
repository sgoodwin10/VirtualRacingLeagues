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

const percentage = computed(() => (props.current / props.max) * 100);
const isNearLimit = computed(() => percentage.value >= 90);
const isAtLimit = computed(() => percentage.value >= 100);

const charCountClasses = computed(() => {
  const baseClasses = 'text-[0.7rem] text-right mt-1 block';
  const colorClass = isAtLimit.value
    ? 'text-[var(--red)] font-semibold'
    : isNearLimit.value
      ? 'text-[var(--orange)]'
      : 'text-[var(--text-muted)]';
  const classes = `${baseClasses} ${colorClass}`;
  return props.class ? `${classes} ${props.class}` : classes;
});
</script>

<template>
  <small :class="charCountClasses"> {{ props.current }} / {{ props.max }} </small>
</template>
