<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  position?: number;
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  position: 1,
  size: 'md',
});

const POSITION_COLORS = {
  1: { bg: '#d29922', text: '#0d1117' }, // Gold
  2: { bg: '#c0c0c0', text: '#0d1117' }, // Silver
  3: { bg: '#cd7f32', text: '#0d1117' }, // Bronze
  default: { bg: 'var(--bg-elevated)', text: 'var(--text-secondary)' },
};

const colors = computed(() => {
  if (props.position === 1) return POSITION_COLORS[1];
  if (props.position === 2) return POSITION_COLORS[2];
  if (props.position === 3) return POSITION_COLORS[3];
  return POSITION_COLORS.default;
});

const sizeClasses = {
  sm: 'min-w-[20px] h-[20px] text-[10px] rounded-[3px]',
  md: 'min-w-[24px] h-[24px] text-[11px] rounded',
  lg: 'min-w-[28px] h-[28px] text-[12px] rounded-md',
};

const fontWeight = computed(() => (props.position <= 3 ? 700 : 600));
</script>

<template>
  <div
    :class="['position-indicator', sizeClasses[size]]"
    :style="{
      backgroundColor: colors.bg,
      color: colors.text,
      fontWeight: fontWeight,
    }"
  >
    {{ position }}
  </div>
</template>

<style scoped>
.position-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  padding: 0 4px;
}
</style>
