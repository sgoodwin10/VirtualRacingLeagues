<script setup lang="ts">
import VrlCloseButton from '@public/components/common/buttons/VrlCloseButton.vue';

/**
 * VRL Velocity Drawer Header Component
 *
 * Drawer header section with optional back button, title, and close button.
 * Designed for use within VrlDrawer component.
 *
 * @example
 * ```vue
 * <VrlDrawerHeader title="Driver Details" :show-back="true" @back="handleBack" @close="handleClose" />
 * ```
 */

interface VrlDrawerHeaderProps {
  /** Header title */
  title?: string;

  /** Whether to show back button */
  showBack?: boolean;

  /** Custom CSS class */
  class?: string;
}

interface VrlDrawerHeaderEmits {
  /** Emitted when back button clicked */
  (e: 'back'): void;

  /** Emitted when close button clicked */
  (e: 'close'): void;
}

const props = withDefaults(defineProps<VrlDrawerHeaderProps>(), {
  title: undefined,
  showBack: false,
  class: undefined,
});

const emit = defineEmits<VrlDrawerHeaderEmits>();

/**
 * Handle back button click
 */
const handleBack = (): void => {
  emit('back');
};

/**
 * Handle close button click
 */
const handleClose = (): void => {
  emit('close');
};
</script>

<template>
  <div
    class="flex items-center gap-4 px-6 py-5 border-b border-[var(--border)]"
    :class="props.class"
    data-test="vrl-drawer-header"
  >
    <!-- Back Button -->
    <button
      v-if="showBack"
      type="button"
      class="w-8 h-8 inline-flex items-center justify-center rounded-md bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-highlight)] hover:text-[var(--text-primary)] transition-all cursor-pointer border-none focus-visible:outline-2 focus-visible:outline-[var(--cyan)] focus-visible:outline-offset-2"
      aria-label="Go back"
      data-test="vrl-drawer-back"
      @click="handleBack"
    >
      <slot name="back-button">
        <span class="text-lg">←</span>
      </slot>
    </button>

    <!-- Title -->
    <h2
      class="flex-1 font-display text-base font-semibold text-[var(--text-primary)]"
      data-test="vrl-drawer-title"
    >
      <slot name="title">{{ title }}</slot>
    </h2>

    <!-- Close Button -->
    <slot name="close">
      <VrlCloseButton @click="handleClose" />
    </slot>
  </div>
</template>
