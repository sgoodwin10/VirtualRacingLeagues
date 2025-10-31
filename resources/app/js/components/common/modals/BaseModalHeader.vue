<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  /**
   * The title text to display in the header
   */
  title?: string;
  /**
   * Additional CSS classes to merge with the default classes
   */
  class?: string;
  /**
   * When true, only uses the provided class instead of merging with defaults
   */
  overrideClass?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  class: undefined,
  overrideClass: false,
});

/**
 * Default classes for the header
 */
const defaultClasses = 'text-lg font-semibold text-gray-900';

/**
 * Computed classes based on override setting
 */
const headerClasses = computed(() => {
  if (props.overrideClass) {
    return props.class || defaultClasses;
  }
  return props.class ? `${defaultClasses} ${props.class}` : defaultClasses;
});
</script>

<template>
  <div :class="headerClasses">
    <slot>{{ title }}</slot>
  </div>
</template>
