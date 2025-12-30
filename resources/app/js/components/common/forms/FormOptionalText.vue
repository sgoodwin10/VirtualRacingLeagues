<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  text: string;
  showOptional?: boolean;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  showOptional: true,
  class: '',
});

const computedClasses = computed(() => {
  // If custom class provided, use it; otherwise use design system defaults
  return props.class || 'text-sm text-[var(--text-muted)]';
});
</script>

<template>
  <p :class="computedClasses">
    <span v-if="showOptional" class="font-medium text-[var(--text-secondary)]">Optional:</span>
    {{ ' ' }}{{ text }}
  </p>
</template>
