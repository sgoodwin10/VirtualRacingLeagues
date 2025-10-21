<template>
  <div :class="containerClasses">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  /**
   * The spacing between child elements using Tailwind's space-y utilities.
   * Defaults to 'space-y-1' if not provided.
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
  spacing: undefined,
  class: '',
});

/**
 * Computed classes for the container div.
 * Combines spacing (with fallback to 'space-y-1') and any additional classes.
 */
const containerClasses = computed(() => {
  const spacingClass = props.spacing ?? 'space-y-1';
  return props.class ? `${spacingClass} ${props.class}` : spacingClass;
});
</script>
