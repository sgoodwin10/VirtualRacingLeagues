<script setup lang="ts">
import { computed } from 'vue';

/**
 * VRL Velocity Close Button Component
 *
 * A reusable close button component for modals, drawers, and other dismissible overlays.
 * Features customizable size and variant with VRL Velocity dark theme styling.
 *
 * @example
 * ```vue
 * <VrlCloseButton @click="handleClose" size="md" variant="default" />
 * ```
 */

interface VrlCloseButtonProps {
  /** Aria label for accessibility */
  ariaLabel?: string;

  /** Custom CSS class */
  class?: string;

  /** Button size */
  size?: 'sm' | 'md' | 'lg';

  /** Button variant */
  variant?: 'default' | 'danger' | 'ghost';
}

interface VrlCloseButtonEmits {
  /** Emitted when button clicked */
  (e: 'click', event: MouseEvent): void;
}

const props = withDefaults(defineProps<VrlCloseButtonProps>(), {
  ariaLabel: 'Close',
  class: undefined,
  size: 'md',
  variant: 'default',
});

const emit = defineEmits<VrlCloseButtonEmits>();

/**
 * Size mapping for button dimensions
 */
const sizeClass = computed(() => {
  const sizeMap: Record<string, string> = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-base',
    lg: 'w-10 h-10 text-lg',
  };

  return sizeMap[props.size] || sizeMap.md;
});

/**
 * Variant mapping for button styles
 */
const variantClass = computed(() => {
  const variantMap: Record<string, string> = {
    default:
      'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-highlight)] hover:text-[var(--text-primary)]',
    danger: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300',
    ghost:
      'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]',
  };

  return variantMap[props.variant] || variantMap.default;
});

/**
 * Handle button click
 */
const handleClick = (event: MouseEvent): void => {
  emit('click', event);
};
</script>

<template>
  <button
    type="button"
    class="vrl-close-button inline-flex items-center justify-center rounded-md transition-all cursor-pointer border-none focus-visible:outline-2 focus-visible:outline-[var(--cyan)] focus-visible:outline-offset-2"
    :class="[sizeClass, variantClass, props.class]"
    :aria-label="ariaLabel"
    @click="handleClick"
  >
    <slot>
      <span class="text-xl leading-none">×</span>
    </slot>
  </button>
</template>

<style scoped>
/* Component-specific styles are in resources/public/css/app.css */
</style>
