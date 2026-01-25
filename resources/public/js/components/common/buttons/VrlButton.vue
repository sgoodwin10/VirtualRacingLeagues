<script setup lang="ts">
import { computed, type Component } from 'vue';
import PrimeButton from 'primevue/button';

/**
 * VRL Velocity Button Component
 *
 * A customizable button component wrapping PrimeVue Button with the VRL Velocity design system.
 * Features Orbitron typography, multiple variants, sizes, and dynamic hover effects.
 *
 * @example
 * ```vue
 * <VrlButton variant="primary" size="lg" @click="handleClick">
 *   Click Me
 * </VrlButton>
 * ```
 */

interface VrlButtonProps {
  /** Visual variant of the button */
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'success' | 'warning' | 'danger';

  /** Size of the button */
  size?: 'sm' | 'default' | 'lg' | 'xl';

  /** Button text label */
  label?: string | null;

  /** Icon component (e.g., from Phosphor Icons) */
  icon?: Component | null;

  /** Icon position relative to text */
  iconPos?: 'left' | 'right';

  /** Disabled state */
  disabled?: boolean;

  /** Loading state with spinner */
  loading?: boolean;

  /** HTML button type */
  type?: 'button' | 'submit' | 'reset';

  /** ARIA label for accessibility */
  ariaLabel?: string | null;

  /** PrimeVue passthrough props for customization */
  pt?: Record<string, unknown>;
}

interface VrlButtonEmits {
  (e: 'click', event: MouseEvent): void;
}

const props = withDefaults(defineProps<VrlButtonProps>(), {
  variant: 'secondary',
  size: 'default',
  label: null,
  icon: null,
  iconPos: 'left',
  disabled: false,
  loading: false,
  type: 'button',
  ariaLabel: null,
});

const emit = defineEmits<VrlButtonEmits>();

/**
 * Computed CSS classes for the button based on variant and size
 */
const buttonClasses = computed(() => {
  const classes = ['vrl-btn'];

  // Add variant class
  classes.push(`vrl-btn-${props.variant}`);

  // Add size class if not default
  if (props.size !== 'default') {
    classes.push(`vrl-btn-${props.size}`);
  }

  return classes.join(' ');
});

/**
 * Determine if this is an icon-only button (no label or slot content)
 */
const isIconOnly = computed(() => {
  return props.icon && !props.label;
});

/**
 * Get the appropriate aria-label
 * Priority: ariaLabel prop > label prop > fallback for icon-only
 */
const effectiveAriaLabel = computed(() => {
  if (props.ariaLabel) return props.ariaLabel;
  if (props.label) return props.label;
  if (isIconOnly.value) return 'Icon button';
  return undefined;
});

/**
 * Handle button click events
 */
const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
};
</script>

<template>
  <PrimeButton
    :class="buttonClasses"
    :disabled="disabled"
    :loading="loading"
    :type="type"
    :icon-pos="iconPos"
    :aria-label="effectiveAriaLabel"
    :pt="pt"
    @click="handleClick"
  >
    <!-- Icon slot (handles both left and right positions) -->
    <template v-if="icon" #icon>
      <component
        :is="icon"
        :size="size === 'sm' ? 16 : size === 'lg' ? 20 : size === 'xl' ? 24 : 18"
      />
    </template>

    <!-- Default slot for button text/content -->
    <slot>
      {{ label }}
    </slot>
  </PrimeButton>
</template>

<style scoped>
/* Component-specific styles are in resources/public/css/components/buttons.css */
</style>
