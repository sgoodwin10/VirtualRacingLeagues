<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  current: number;
  max: number;
  class?: string;
  warningThreshold?: number;
  errorThreshold?: number;
}

const props = withDefaults(defineProps<Props>(), {
  class: '',
  warningThreshold: 0.9,
  errorThreshold: 1.0,
});

const isNearLimit = computed(() => props.current >= props.max * props.warningThreshold);
const isOverLimit = computed(() => props.current >= props.max * props.errorThreshold);

const stateClass = computed(() => {
  if (isOverLimit.value) return 'character-count--error';
  if (isNearLimit.value) return 'character-count--warning';
  return '';
});
</script>

<template>
  <small :class="['character-count', stateClass, props.class]">
    {{ props.current }}/{{ props.max }} characters
  </small>
</template>

<style scoped>
.character-count {
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: var(--text-muted);
}

.character-count--warning {
  color: var(--orange);
}

.character-count--error {
  color: var(--red);
  font-weight: 500;
}
</style>
