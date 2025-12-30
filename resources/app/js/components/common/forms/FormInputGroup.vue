<template>
  <div :class="containerClasses">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type LayoutMode = 'vertical' | 'horizontal';

interface Props {
  /**
   * Layout mode for the form group.
   * - 'vertical': Stacks fields vertically with bottom margin (default)
   * - 'horizontal': Arranges fields in a grid layout side-by-side
   * @default 'vertical'
   */
  layout?: LayoutMode;

  /**
   * Number of columns for horizontal layout.
   * Only applies when layout is 'horizontal'.
   * @default 2
   */
  columns?: 2 | 3 | 4;

  /**
   * Legacy spacing prop using Tailwind's space-y utilities.
   * @deprecated Use layout prop instead. Takes precedence over layout if provided.
   * @example 'space-y-2', 'space-y-4', 'space-y-6'
   */
  spacing?: string;

  /**
   * Additional CSS classes to apply to the container.
   * @example 'mb-4', 'mt-2'
   */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'vertical',
  columns: 2,
  spacing: undefined,
  class: '',
});

/**
 * Computed classes for the container div.
 * Prioritizes legacy spacing prop for backward compatibility,
 * otherwise uses design system classes based on layout mode.
 */
const containerClasses = computed(() => {
  const classes: string[] = [];

  // Handle legacy spacing prop for backward compatibility
  // If spacing is provided, use it and ignore layout/columns
  if (props.spacing) {
    classes.push(props.spacing);
  } else {
    // Use new CSS classes based on layout mode
    if (props.layout === 'horizontal') {
      if (props.columns === 3) {
        classes.push('form-row-3');
      } else if (props.columns === 4) {
        classes.push('form-row-4');
      } else {
        classes.push('form-row');
      }
    } else {
      classes.push('form-group');
    }
  }

  // Add custom classes
  if (props.class) {
    classes.push(props.class);
  }

  return classes.join(' ');
});
</script>
