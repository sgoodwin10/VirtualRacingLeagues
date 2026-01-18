<script setup lang="ts">
import { computed } from 'vue';
import Sidebar from 'primevue/sidebar';
import type { SidebarProps } from 'primevue/sidebar';

/**
 * VRL Velocity Drawer Component
 *
 * A customizable drawer/sidebar component wrapping PrimeVue Sidebar with the VRL Velocity design system.
 * Features slide-out panel from any screen edge with dark theme styling.
 *
 * @example
 * ```vue
 * <VrlDrawer v-model:visible="isOpen" title="Driver Details" position="right">
 *   <VrlDrawerBody>
 *     <p>Drawer content here</p>
 *   </VrlDrawerBody>
 * </VrlDrawer>
 * ```
 */

interface VrlDrawerProps {
  /** Controls visibility (v-model) */
  visible: boolean;

  /** Drawer title */
  title?: string;

  /** Drawer position */
  position?: 'left' | 'right' | 'top' | 'bottom';

  /** Drawer width (for left/right) */
  width?: string;

  /** Drawer height (for top/bottom) */
  height?: string;

  /** Whether to show close button in header */
  closable?: boolean;

  /** Whether clicking backdrop closes drawer */
  closeOnBackdrop?: boolean;

  /** Whether ESC key closes drawer */
  closeOnEscape?: boolean;

  /** Whether to block scroll when open */
  blockScroll?: boolean;

  /** Custom CSS class */
  class?: string;

  /** Aria label for accessibility */
  ariaLabel?: string;

  /** PrimeVue passthrough props for customization */
  pt?: SidebarProps['pt'];

  /** Whether to use PrimeVue's unstyled mode */
  unstyled?: boolean;
}

interface VrlDrawerEmits {
  /** Update visibility state */
  (e: 'update:visible', value: boolean): void;

  /** Emitted when drawer is closing */
  (e: 'close'): void;

  /** Emitted when drawer is shown */
  (e: 'show'): void;

  /** Emitted when drawer is hidden */
  (e: 'hide'): void;
}

const props = withDefaults(defineProps<VrlDrawerProps>(), {
  title: undefined,
  position: 'right',
  width: '400px',
  height: '100%',
  closable: true,
  closeOnBackdrop: false,
  closeOnEscape: true,
  blockScroll: true,
  class: undefined,
  ariaLabel: undefined,
  pt: undefined,
  unstyled: false,
});

const emit = defineEmits<VrlDrawerEmits>();

/**
 * Computed class for drawer container
 */
const drawerClass = computed(() => {
  return `vrl-drawer ${props.class || ''}`.trim();
});

/**
 * PrimeVue PassThrough configuration for VRL styling
 */
const ptConfig = computed(() => {
  const baseClasses = 'vrl-drawer border border-[var(--border)] bg-[var(--bg-card)]';
  const borderRadiusClass =
    props.position === 'right'
      ? 'rounded-l-xl'
      : props.position === 'left'
        ? 'rounded-r-xl'
        : props.position === 'top'
          ? 'rounded-b-xl'
          : 'rounded-t-xl';

  return {
    root: {
      class: `${baseClasses} ${borderRadiusClass}`,
      style: {
        width: props.position === 'left' || props.position === 'right' ? props.width : '100%',
        height: props.position === 'top' || props.position === 'bottom' ? props.height : '100%',
      },
    },
    header: {
      class: 'vrl-drawer-header flex items-center gap-4 px-6 py-5 border-b border-[var(--border)]',
    },
    title: {
      class: 'vrl-drawer-title font-display text-base font-semibold flex-1',
    },
    content: {
      class: 'vrl-drawer-body flex-1 p-6 overflow-y-auto',
    },
    mask: {
      class: 'vrl-drawer-mask bg-black/60 backdrop-blur-sm',
    },
    closeButton: {
      class:
        'w-8 h-8 rounded-md bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-highlight)] hover:text-[var(--text-primary)] transition-all',
    },
    ...props.pt,
  };
});

/**
 * Handle visible state updates
 */
const handleUpdateVisible = (value: boolean): void => {
  emit('update:visible', value);
  if (!value) {
    emit('close');
  }
};

/**
 * Handle show event
 */
const handleShow = (): void => {
  emit('show');
};

/**
 * Handle hide event
 */
const handleHide = (): void => {
  emit('hide');
};
</script>

<template>
  <Sidebar
    :visible="visible"
    :header="title"
    :position="position"
    :closable="closable"
    :dismissable="closeOnBackdrop"
    :modal="true"
    :block-scroll="blockScroll"
    :class="drawerClass"
    :aria-label="ariaLabel"
    :pt="ptConfig"
    :unstyled="unstyled"
    @update:visible="handleUpdateVisible"
    @show="handleShow"
    @hide="handleHide"
  >
    <!-- Header slot passthrough -->
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>

    <!-- Default content -->
    <slot />

    <!-- Close icon slot -->
    <template v-if="$slots.closeicon" #closeicon="slotProps">
      <slot name="closeicon" v-bind="slotProps" />
    </template>
  </Sidebar>
</template>

<style scoped>
/* Component-specific styles are in resources/public/css/app.css */
</style>
