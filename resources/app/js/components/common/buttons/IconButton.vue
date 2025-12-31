<script setup lang="ts">
import Button from './Button.vue';
import type { Component } from 'vue';

interface Props {
  icon: Component;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'default' | 'lg';
  disabled?: boolean;
  tooltip?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
  ariaLabel?: string;
}

withDefaults(defineProps<Props>(), {
  variant: 'secondary',
  size: 'default',
  disabled: false,
  tooltip: undefined,
  tooltipPosition: 'top',
  ariaLabel: undefined,
});

interface Emits {
  (e: 'click', event: MouseEvent): void;
}

const emit = defineEmits<Emits>();
</script>

<template>
  <Button
    v-tooltip="tooltip ? { value: tooltip, position: tooltipPosition } : undefined"
    :icon="icon"
    :variant="variant"
    :size="size"
    :disabled="disabled"
    :aria-label="ariaLabel || tooltip || 'Button'"
    class="app-icon-button"
    @click="emit('click', $event)"
  />
</template>

<style scoped>
/* Icon button specific styles in buttons.css */
</style>
