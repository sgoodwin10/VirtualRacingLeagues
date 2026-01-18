<script setup lang="ts">
import { computed } from 'vue';

/**
 * VRL Velocity Drawer Body Component
 *
 * Drawer content area with configurable padding and scrolling.
 * Designed for use within VrlDrawer component.
 *
 * @example
 * ```vue
 * <VrlDrawerBody padding="md" :scrollable="true">
 *   <p>Drawer content goes here</p>
 * </VrlDrawerBody>
 * ```
 */

interface VrlDrawerBodyProps {
  /** Custom CSS class */
  class?: string;

  /** Padding size preset */
  padding?: 'none' | 'sm' | 'md' | 'lg';

  /** Whether to enable scrolling */
  scrollable?: boolean;
}

const props = withDefaults(defineProps<VrlDrawerBodyProps>(), {
  class: undefined,
  padding: 'md',
  scrollable: true,
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

/**
 * Overflow class based on scrollable prop
 */
const overflowClass = computed(() => {
  return props.scrollable ? 'overflow-y-auto' : 'overflow-hidden';
});
</script>

<template>
  <div
    class="flex-1 bg-[var(--bg-card)]"
    :class="[paddingClass, overflowClass, props.class]"
    data-test="vrl-drawer-body"
  >
    <slot />
  </div>
</template>

<style scoped>
/* Custom scrollbar styling for drawer body */
[data-test='vrl-drawer-body']::-webkit-scrollbar {
  width: 8px;
}

[data-test='vrl-drawer-body']::-webkit-scrollbar-track {
  background: var(--bg-elevated);
  border-radius: 4px;
}

[data-test='vrl-drawer-body']::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 4px;
}

[data-test='vrl-drawer-body']::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}
</style>
