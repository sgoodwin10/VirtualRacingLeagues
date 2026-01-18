<script setup lang="ts">
import { computed } from 'vue';

/**
 * VRL Velocity Modal Body Component
 *
 * Modal content area with configurable padding.
 * Designed for use within VrlModal component.
 *
 * @example
 * ```vue
 * <VrlModalBody padding="md">
 *   <p>Modal content goes here</p>
 * </VrlModalBody>
 * ```
 */

interface VrlModalBodyProps {
  /** Custom CSS class */
  class?: string;

  /** Padding size preset */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<VrlModalBodyProps>(), {
  class: undefined,
  padding: 'md',
});

/**
 * Padding class mapping
 */
const paddingClass = computed(() => {
  const paddingMap: Record<string, string> = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return paddingMap[props.padding] || paddingMap.md;
});
</script>

<template>
  <div class="bg-[var(--bg-card)]" :class="[paddingClass, props.class]" data-test="vrl-modal-body">
    <slot />
  </div>
</template>
