<script setup lang="ts">
import { computed } from 'vue';

interface CountIndicatorProps {
  count?: number | string;
  variant?: 'cyan' | 'orange' | 'red';
  max?: number;
}

const props = withDefaults(defineProps<CountIndicatorProps>(), {
  count: 0,
  variant: 'cyan',
  max: 99,
});

const displayCount = computed(() => {
  if (typeof props.count === 'string') {
    return props.count;
  }

  if (props.count > props.max) {
    return `${props.max}+`;
  }

  return props.count.toString();
});
</script>

<template>
  <span class="count-indicator" :class="`count-indicator--${variant}`">
    {{ displayCount }}
  </span>
</template>

<style scoped>
.count-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  border-radius: 10px;
}

.count-indicator--cyan {
  background: var(--cyan-dim);
  color: var(--cyan);
}

.count-indicator--orange {
  background: var(--orange-dim);
  color: var(--orange);
}

.count-indicator--red {
  background: var(--red-dim);
  color: var(--red);
}
</style>
