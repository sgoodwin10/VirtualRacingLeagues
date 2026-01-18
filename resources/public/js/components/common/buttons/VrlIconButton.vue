<script setup lang="ts">
import { computed, onMounted, type Component } from 'vue';
import VrlButton from './VrlButton.vue';

/**
 * VRL Velocity Icon Button Component
 *
 * A specialized square button for icon-only actions (e.g., close, expand, settings).
 * Wraps VrlButton with enforced square dimensions and tooltip support.
 *
 * @example
 * ```vue
 * <VrlIconButton
 *   :icon="PhX"
 *   variant="ghost"
 *   tooltip="Close"
 *   @click="handleClose"
 * />
 * ```
 */

interface VrlIconButtonProps {
  /** Icon component (required - e.g., from Phosphor Icons) */
  icon: Component;

  /** Visual variant of the button */
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'success' | 'warning' | 'danger';

  /** Size of the button (square dimensions) */
  size?: 'sm' | 'default' | 'lg';

  /** Disabled state */
  disabled?: boolean;

  /** Tooltip text (shown on hover) */
  tooltip?: string | null;

  /** Tooltip position */
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';

  /** ARIA label for accessibility (required if no tooltip) */
  ariaLabel?: string | null;
}

interface VrlIconButtonEmits {
  (e: 'click', event: MouseEvent): void;
}

const props = withDefaults(defineProps<VrlIconButtonProps>(), {
  variant: 'secondary',
  size: 'default',
  disabled: false,
  tooltip: null,
  tooltipPosition: 'top',
  ariaLabel: null,
});

const emit = defineEmits<VrlIconButtonEmits>();

/**
 * Computed effective aria-label
 * Priority: ariaLabel prop > tooltip > fallback warning
 */
const effectiveAriaLabel = computed(() => {
  if (props.ariaLabel) return props.ariaLabel;
  if (props.tooltip) return props.tooltip;
  return 'Icon button';
});

/**
 * Warn if neither tooltip nor ariaLabel is provided (accessibility issue)
 */
onMounted(() => {
  if (!props.tooltip && !props.ariaLabel) {
    console.warn(
      '[VrlIconButton] Neither "tooltip" nor "ariaLabel" prop was provided. ' +
        'For accessibility, please provide at least one of these props.',
    );
  }
});

/**
 * Handle button click events
 */
const handleClick = (event: MouseEvent) => {
  emit('click', event);
};
</script>

<template>
  <VrlButton
    v-tooltip.top="tooltip"
    :icon="icon"
    :variant="variant"
    :size="size"
    :disabled="disabled"
    :aria-label="effectiveAriaLabel"
    class="vrl-btn-icon"
    @click="handleClick"
  />
</template>

<style scoped>
/* Icon button specific styles are in resources/public/css/components/buttons.css */
</style>
