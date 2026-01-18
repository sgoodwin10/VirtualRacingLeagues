<script setup lang="ts">
import VrlCloseButton from '@public/components/common/buttons/VrlCloseButton.vue';

/**
 * VRL Velocity Modal Header Component
 *
 * Modal header section with title and optional close button.
 * Designed for use within VrlModal component.
 *
 * @example
 * ```vue
 * <VrlModalHeader title="Add New Driver" :closable="true" @close="handleClose" />
 * ```
 */

interface VrlModalHeaderProps {
  /** Header title text */
  title?: string;

  /** Whether to show close button */
  closable?: boolean;

  /** Custom CSS class */
  class?: string;
}

interface VrlModalHeaderEmits {
  /** Emitted when close button clicked */
  (e: 'close'): void;
}

const props = withDefaults(defineProps<VrlModalHeaderProps>(), {
  title: undefined,
  closable: true,
  class: undefined,
});

const emit = defineEmits<VrlModalHeaderEmits>();

/**
 * Handle close button click
 */
const handleClose = (): void => {
  emit('close');
};
</script>

<template>
  <div
    class="flex items-center justify-between px-6 py-5 border-b border-[var(--border)] bg-[var(--bg-card)]"
    :class="props.class"
    data-test="vrl-modal-header"
  >
    <h2
      class="font-display text-[1.1rem] font-semibold tracking-wide text-[var(--text-primary)]"
      data-test="vrl-modal-title"
    >
      <slot>{{ title }}</slot>
    </h2>

    <slot name="close">
      <VrlCloseButton v-if="closable" @click="handleClose" />
    </slot>
  </div>
</template>
