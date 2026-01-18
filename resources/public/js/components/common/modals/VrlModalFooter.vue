<script setup lang="ts">
import { computed } from 'vue';

/**
 * VRL Velocity Modal Footer Component
 *
 * Modal footer section for action buttons with configurable alignment and spacing.
 * Designed for use within VrlModal component.
 *
 * @example
 * ```vue
 * <VrlModalFooter align="right" gap="md">
 *   <VrlButton variant="secondary">Cancel</VrlButton>
 *   <VrlButton variant="primary">Save</VrlButton>
 * </VrlModalFooter>
 * ```
 */

interface VrlModalFooterProps {
  /** Custom CSS class */
  class?: string;

  /** Footer layout alignment */
  align?: 'left' | 'center' | 'right' | 'between';

  /** Gap between buttons */
  gap?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<VrlModalFooterProps>(), {
  class: undefined,
  align: 'right',
  gap: 'md',
});

/**
 * Alignment class mapping
 */
const alignClass = computed(() => {
  const alignMap: Record<string, string> = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  };

  return alignMap[props.align] || alignMap.right;
});

/**
 * Gap class mapping
 */
const gapClass = computed(() => {
  const gapMap: Record<string, string> = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
  };

  return gapMap[props.gap] || gapMap.md;
});
</script>

<template>
  <div
    class="flex px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-panel)]"
    :class="[alignClass, gapClass, props.class]"
    data-test="vrl-modal-footer"
  >
    <slot />
  </div>
</template>
