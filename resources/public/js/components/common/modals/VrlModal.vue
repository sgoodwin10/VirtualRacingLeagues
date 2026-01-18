<script setup lang="ts">
import { computed } from 'vue';
import Dialog from 'primevue/dialog';
import type { DialogProps } from 'primevue/dialog';

/**
 * VRL Velocity Modal Component
 *
 * A customizable modal dialog component wrapping PrimeVue Dialog with the VRL Velocity design system.
 * Features dark theme, flexible sizing, and comprehensive accessibility support.
 *
 * @example
 * ```vue
 * <VrlModal v-model:visible="isOpen" title="Add Driver" width="lg">
 *   <VrlModalBody>
 *     <p>Modal content here</p>
 *   </VrlModalBody>
 * </VrlModal>
 * ```
 */

interface VrlModalProps {
  /** Controls visibility (v-model) */
  visible: boolean;

  /** Modal title (can be overridden with header slot) */
  title?: string;

  /** Modal width preset or custom value */
  width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | string;

  /** Whether the modal can be closed with X button */
  closable?: boolean;

  /** Whether clicking backdrop closes the modal */
  closeOnBackdrop?: boolean;

  /** Whether ESC key closes the modal */
  closeOnEscape?: boolean;

  /** Whether to block page scroll when open */
  blockScroll?: boolean;

  /** Whether to show maximizable button */
  maximizable?: boolean;

  /** Custom CSS class for modal container */
  class?: string;

  /** Aria label for accessibility */
  ariaLabel?: string;

  /** Position on screen */
  position?: DialogProps['position'];

  /** PrimeVue passthrough props for customization */
  pt?: DialogProps['pt'];

  /** Whether to use PrimeVue's unstyled mode */
  unstyled?: boolean;
}

interface VrlModalEmits {
  /** Update visibility state */
  (e: 'update:visible', value: boolean): void;

  /** Emitted when modal is closing */
  (e: 'close'): void;

  /** Emitted when modal is shown */
  (e: 'show'): void;

  /** Emitted when modal is hidden */
  (e: 'hide'): void;

  /** Emitted after hide transition completes */
  (e: 'after-hide'): void;
}

const props = withDefaults(defineProps<VrlModalProps>(), {
  title: undefined,
  width: 'lg',
  closable: true,
  closeOnBackdrop: false,
  closeOnEscape: true,
  blockScroll: true,
  maximizable: false,
  class: undefined,
  ariaLabel: undefined,
  position: 'center',
  pt: undefined,
  unstyled: false,
});

const emit = defineEmits<VrlModalEmits>();

/**
 * Computed width class based on prop
 */
const widthClass = computed(() => {
  const widthMap: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
  };

  return widthMap[props.width] || props.width;
});

/**
 * Computed class combining width and custom classes
 */
const dialogClass = computed(() => {
  return `w-full ${widthClass.value} ${props.class || ''}`.trim();
});

/**
 * PrimeVue PassThrough configuration for VRL styling
 */
const ptConfig = computed(() => ({
  root: {
    class:
      'vrl-modal rounded-[16px] border border-[var(--border)] shadow-[0_25px_50px_rgba(0,0,0,0.5)]',
  },
  header: {
    class:
      'vrl-modal-header flex items-center justify-between px-6 py-5 border-b border-[var(--border)] bg-[var(--bg-card)]',
  },
  title: {
    class: 'vrl-modal-title font-display text-[1.1rem] font-semibold tracking-wide',
  },
  content: {
    class: 'vrl-modal-body p-6 bg-[var(--bg-card)]',
  },
  footer: {
    class:
      'vrl-modal-footer flex justify-end gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-panel)]',
  },
  mask: {
    class: 'vrl-modal-mask bg-black/60 backdrop-blur-sm',
  },
  closeButton: {
    class:
      'w-8 h-8 rounded-md bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-highlight)] hover:text-[var(--text-primary)] transition-all',
  },
  ...props.pt,
}));

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

/**
 * Handle after-hide event
 */
const handleAfterHide = (): void => {
  emit('after-hide');
};
</script>

<template>
  <Dialog
    :visible="visible"
    :header="title"
    :position="position"
    :closable="closable"
    :modal="true"
    :dismissable-mask="closeOnBackdrop"
    :block-scroll="blockScroll"
    :maximizable="maximizable"
    :class="dialogClass"
    :aria-label="ariaLabel"
    :pt="ptConfig"
    :unstyled="unstyled"
    @update:visible="handleUpdateVisible"
    @show="handleShow"
    @hide="handleHide"
    @after-hide="handleAfterHide"
  >
    <!-- Header Slot - allows complete header customization -->
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>

    <!-- Default Content Slot -->
    <slot />

    <!-- Footer Slot - allows custom footer buttons/actions -->
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>

    <!-- Closeicon Slot - custom close icon -->
    <template v-if="$slots.closeicon" #closeicon="slotProps">
      <slot name="closeicon" v-bind="slotProps" />
    </template>
  </Dialog>
</template>

<style scoped>
/* Component-specific styles are in resources/public/css/app.css */
</style>
