<script setup lang="ts">
import { computed, type Component } from 'vue';
import type { AccordionIconVariant } from './types';
import { ICON_VARIANT_MAP } from './types';

interface Props {
  icon: Component;
  variant?: AccordionIconVariant;
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'cyan',
  size: 'md',
});

const color = computed(() => ICON_VARIANT_MAP[props.variant]);

const sizeMap = {
  sm: { container: '24px', icon: 16 },
  md: { container: '32px', icon: 20 },
  lg: { container: '40px', icon: 24 },
};

const containerSize = computed(() => sizeMap[props.size].container);
const iconSize = computed(() => sizeMap[props.size].icon);

const backgroundColor = computed(() => {
  return `${color.value}26`;
});
</script>

<template>
  <div
    class="accordion-icon-container"
    :style="{
      backgroundColor: backgroundColor,
      width: containerSize,
      height: containerSize,
    }"
  >
    <component :is="icon" :size="iconSize" :color="color" weight="regular" />
  </div>
</template>

<style scoped>
.accordion-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  flex-shrink: 0;
  transition: all 0.2s ease;
}
</style>
