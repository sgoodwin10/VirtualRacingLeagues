<script setup lang="ts">
import { computed } from 'vue';
import Dialog from 'primevue/dialog';
import type { DialogProps } from 'primevue/dialog';

/**
 * BaseModal Props Interface
 *
 * Extends PrimeVue Dialog props with custom configuration options
 */
interface Props {
  /** Controls the visibility of the modal */
  visible: boolean;

  /** Modal header text (can be overridden with header slot) */
  header?: string;

  /** Modal width - accepts Tailwind classes or custom width */
  width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | 'full' | string;

  /** Modal position on screen */
  position?: DialogProps['position'];

  /** Whether the modal is draggable */
  draggable?: boolean;

  /** Whether the modal can be closed with the X button */
  closable?: boolean;

  /** Whether clicking outside the modal closes it (modal backdrop) */
  modal?: boolean;

  /** Whether the modal can be dismissed by pressing ESC key */
  dismissableMask?: boolean;

  /** Whether to block scroll when modal is open */
  blockScroll?: boolean;

  /** Custom CSS class for the dialog container */
  class?: string;

  /** Custom CSS class for the content area */
  contentClass?: string;

  /** Whether to show the modal maximized */
  maximizable?: boolean;

  /** Whether to show header */
  showHeader?: boolean;

  /** Whether the modal is in a loading state */
  loading?: boolean;

  /** Aria label for accessibility */
  ariaLabel?: string;

  /** Additional passthrough props for PrimeVue Dialog */
  pt?: DialogProps['pt'];

  /** Unstyled mode */
  unstyled?: boolean;
}

/**
 * BaseModal Emits Interface
 *
 * Matches PrimeVue Dialog events with proper TypeScript typing
 */
interface Emits {
  /** Emitted when the visible state should be updated */
  (e: 'update:visible', value: boolean): void;

  /** Emitted when the modal is shown */
  (e: 'show'): void;

  /** Emitted when the modal is hidden */
  (e: 'hide'): void;

  /** Emitted after the modal is shown (transition complete) */
  (e: 'after-hide'): void;

  /** Emitted when the maximize button is clicked */
  (e: 'maximize', value: Event): void;

  /** Emitted when the unmaximize button is clicked */
  (e: 'unmaximize', value: Event): void;

  /** Emitted when drag starts */
  (e: 'dragstart', value: DragEvent): void;

  /** Emitted when drag ends */
  (e: 'dragend', value: DragEvent): void;
}

const props = withDefaults(defineProps<Props>(), {
  header: undefined,
  width: 'lg',
  position: 'center',
  draggable: false,
  closable: true,
  modal: true,
  dismissableMask: false,
  blockScroll: true,
  class: undefined,
  contentClass: undefined,
  maximizable: false,
  showHeader: true,
  loading: false,
  ariaLabel: undefined,
  pt: undefined,
  unstyled: false,
});

const emit = defineEmits<Emits>();

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
    '4xl': 'max-w-4xl',
    full: 'max-w-full',
    '6xl': 'max-w-6xl',
    '5xl': 'max-w-5xl',
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
 * Handle visible state updates
 */
const handleUpdateVisible = (value: boolean): void => {
  emit('update:visible', value);
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

/**
 * Handle maximize event
 */
const handleMaximize = (event: Event): void => {
  emit('maximize', event);
};

/**
 * Handle unmaximize event
 */
const handleUnmaximize = (event: Event): void => {
  emit('unmaximize', event);
};

/**
 * Handle dragstart event
 */
const handleDragStart = (event: Event): void => {
  emit('dragstart', event as DragEvent);
};

/**
 * Handle dragend event
 */
const handleDragEnd = (event: Event): void => {
  emit('dragend', event as DragEvent);
};
</script>

<template>
  <Dialog
    :visible="visible"
    :header="header"
    :position="position"
    :draggable="draggable"
    :closable="closable"
    :modal="modal"
    :dismissable-mask="dismissableMask"
    :block-scroll="blockScroll"
    :maximizable="maximizable"
    :show-header="showHeader"
    :class="dialogClass"
    :content-class="contentClass"
    :aria-label="ariaLabel"
    :pt="pt"
    :unstyled="unstyled"
    @update:visible="handleUpdateVisible"
    @show="handleShow"
    @hide="handleHide"
    @after-hide="handleAfterHide"
    @maximize="handleMaximize"
    @unmaximize="handleUnmaximize"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
  >
    <!-- Header Slot - allows complete header customization -->
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>

    <!-- Loading State Overlay -->
    <div v-if="loading" class="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
      <i class="pi pi-spinner pi-spin text-4xl text-primary" />
    </div>

    <!-- Default Content Slot -->
    <slot />

    <!-- Footer Slot - allows custom footer buttons/actions -->
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>

    <!-- Container Slot - complete customization of dialog container -->
    <template v-if="$slots.container" #container="slotProps">
      <slot name="container" v-bind="slotProps" />
    </template>

    <!-- Closeicon Slot - custom close icon -->
    <template v-if="$slots.closeicon" #closeicon="slotProps">
      <slot name="closeicon" v-bind="slotProps" />
    </template>

    <!-- Maximizeicon Slot - custom maximize icon -->
    <template v-if="$slots.maximizeicon" #maximizeicon="slotProps">
      <slot name="maximizeicon" v-bind="slotProps" />
    </template>
  </Dialog>
</template>
