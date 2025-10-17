<template>
  <Dialog
    :visible="visible"
    :modal="modal"
    :dismissable-mask="dismissableMask"
    :closable="closable"
    :draggable="draggable"
    :style="{ width: width }"
    :pt="mergedPt"
    :pt-options="ptOptions"
    @update:visible="handleVisibleChange"
  >
    <!-- Custom Header Slot -->
    <template v-if="$slots.header" #header>
      <div class="text-lg font-semibold text-gray-900">
        <slot name="header" />
      </div>
    </template>

    <!-- Default Content Slot -->
    <slot />

    <!-- Custom Footer Slot -->
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Dialog from 'primevue/dialog';
import type { DialogPassThroughOptions } from 'primevue/dialog';

/**
 * Props interface for BaseModal component
 */
export interface BaseModalProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean;

  /**
   * Whether the modal should be displayed as a modal overlay
   * @default true
   */
  modal?: boolean;

  /**
   * Whether clicking the mask dismisses the modal
   * @default true
   */
  dismissableMask?: boolean;

  /**
   * Whether the close icon is displayed
   * @default true
   */
  closable?: boolean;

  /**
   * Whether the modal is draggable
   * @default false
   */
  draggable?: boolean;

  /**
   * Width of the modal
   * @default '600px'
   */
  width?: string;

  /**
   * Pass-through attributes for PrimeVue Dialog
   */
  pt?: DialogPassThroughOptions;

  /**
   * Pass-through options for PrimeVue Dialog
   */
  ptOptions?: any;
}

/**
 * Emits interface for BaseModal component
 */
export interface BaseModalEmits {
  /**
   * Emitted when the modal visibility changes
   */
  (event: 'update:visible', value: boolean): void;

  /**
   * Emitted when the modal is closed
   */
  (event: 'close'): void;
}

// Props with defaults
const props = withDefaults(defineProps<BaseModalProps>(), {
  modal: true,
  dismissableMask: true,
  closable: true,
  draggable: false,
  width: '600px',
});

// Emits
const emit = defineEmits<BaseModalEmits>();

/**
 * Default pass-through configuration for BaseModal styling
 */
const defaultPt: DialogPassThroughOptions = {
  header: {
    class:
      'border-b border-gray-200 bg-gray-50 py-3 px-4 rounded-t-lg shadow-md shadow-gray-900/75',
  },
  content: {
    class: 'bg-white p-4',
  },
  footer: {
    class: 'border-t border-gray-200 bg-gray-50 p-4 rounded-b-lg',
  },
  pcCloseButton: {
    root: {
      class: 'bg-white border border-gray-100 rounded-full hover:bg-gray-200',
    },
  },
};

/**
 * Merge default pt with custom pt from props
 */
const mergedPt = computed(() => {
  if (!props.pt) return defaultPt;

  return {
    ...defaultPt,
    ...props.pt,
    header: {
      ...(typeof defaultPt.header === 'object' ? defaultPt.header : {}),
      ...(typeof props.pt.header === 'object' ? props.pt.header : {}),
    },
    content: {
      ...(typeof defaultPt.content === 'object' ? defaultPt.content : {}),
      ...(typeof props.pt.content === 'object' ? props.pt.content : {}),
    },
    footer: {
      ...(typeof defaultPt.footer === 'object' ? defaultPt.footer : {}),
      ...(typeof props.pt.footer === 'object' ? props.pt.footer : {}),
    },
    pcCloseButton: {
      root: {
        ...(typeof defaultPt.pcCloseButton?.root === 'object' ? defaultPt.pcCloseButton.root : {}),
        ...(typeof props.pt.pcCloseButton?.root === 'object' ? props.pt.pcCloseButton.root : {}),
      },
    },
  };
});

/**
 * Handle visibility change from Dialog component
 */
const handleVisibleChange = (value: boolean): void => {
  emit('update:visible', value);
  if (!value) {
    emit('close');
  }
};
</script>

<style scoped>
/**
 * BaseModal Custom Styles
 *
 * Styling is handled via PrimeVue's pass-through (pt) system in the script section.
 * This provides better control and allows child components to override styles if needed.
 */
</style>
