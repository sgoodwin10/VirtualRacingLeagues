<script setup lang="ts">
import { computed } from 'vue';

/**
 * Props for the HTag component
 */
interface Props {
  /**
   * Heading level (1-6) - determines which heading tag to render (h1, h2, h3, etc.)
   * @default 1
   */
  level?: 1 | 2 | 3 | 4 | 5 | 6;

  /**
   * Additional CSS classes to merge with the default classes for the heading level
   * @example "mb-4 text-primary"
   */
  additionalClasses?: string;

  /**
   * Override classes - completely replaces the default classes for the heading level
   * When provided, default classes are ignored
   * @example "text-4xl font-black uppercase"
   */
  overrideClasses?: string;
}

const props = withDefaults(defineProps<Props>(), {
  level: 1,
  additionalClasses: '',
  overrideClasses: '',
});

/**
 * Default Tailwind CSS classes for each heading level
 * Following the design system standards
 */
const defaultClasses: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
  1: 'text-3xl font-bold',
  2: 'text-2xl font-bold',
  3: 'text-xl font-semibold',
  4: 'text-lg font-semibold',
  5: 'text-base font-semibold',
  6: 'text-sm font-semibold',
};

/**
 * Component tag name based on the heading level
 */
const tag = computed(() => `h${props.level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6');

/**
 * Computed classes based on override/additional class logic
 * - If overrideClasses is provided, use only those classes
 * - Otherwise, use default classes and merge with additionalClasses if provided
 */
const classes = computed(() => {
  if (props.overrideClasses) {
    return props.overrideClasses;
  }

  const baseClasses = defaultClasses[props.level];

  if (props.additionalClasses) {
    return `${baseClasses} ${props.additionalClasses}`;
  }

  return baseClasses;
});
</script>

<template>
  <component :is="tag" :class="classes">
    <slot />
  </component>
</template>
