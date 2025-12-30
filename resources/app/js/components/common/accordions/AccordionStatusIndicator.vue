<script setup lang="ts">
import { computed } from 'vue';
import type { AccordionStatus } from './types';
import { STATUS_COLOR_MAP } from './types';

interface Props {
  status: AccordionStatus;
  height?: string;
}

const props = withDefaults(defineProps<Props>(), {
  height: '40px',
});

const backgroundColor = computed(() => STATUS_COLOR_MAP[props.status]);

const hasGlow = computed(() => props.status === 'active');

const glowStyle = computed(() => {
  if (!hasGlow.value) return {};
  return {
    boxShadow: `0 0 8px ${backgroundColor.value}`,
  };
});
</script>

<template>
  <div
    class="status-indicator"
    :style="{
      backgroundColor: backgroundColor,
      height: height,
      ...glowStyle,
    }"
  />
</template>

<style scoped>
.status-indicator {
  width: 4px;
  border-radius: 2px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}
</style>
