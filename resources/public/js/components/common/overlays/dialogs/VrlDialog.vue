<script setup lang="ts">
/* global HTMLElement */
import { computed, watch, onUnmounted, ref, nextTick } from 'vue';
import { PhCheckCircle, PhWarning, PhTrash, PhInfo } from '@phosphor-icons/vue';
import type { Component } from 'vue';
import { incrementOverlayCount, decrementOverlayCount, resetOverlayCount } from '../overlayState';

interface Props {
  modelValue: boolean;
  variant?: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  message: string;
  icon?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmOnly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'info',
  icon: undefined,
  confirmLabel: undefined,
  cancelLabel: 'Cancel',
  confirmOnly: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  confirm: [];
  cancel: [];
}>();

const dialogRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const previousActiveElement = ref<HTMLElement | null>(null);

// Icon mapping based on variant
const variantIcons: Record<'success' | 'warning' | 'danger' | 'info', Component> = {
  success: PhCheckCircle,
  warning: PhWarning,
  danger: PhTrash,
  info: PhInfo,
};

// Default confirm labels based on variant
const defaultConfirmLabels: Record<'success' | 'warning' | 'danger' | 'info', string> = {
  success: 'Continue',
  warning: 'Leave',
  danger: 'Delete',
  info: 'Got It',
};

// Focus trap implementation
const focusableElements =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const trapFocus = (e: KeyboardEvent) => {
  if (!contentRef.value || e.key !== 'Tab') return;

  const focusable = Array.from(
    contentRef.value.querySelectorAll(focusableElements),
  ) as HTMLElement[];

  const firstFocusable = focusable[0];
  const lastFocusable = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === firstFocusable) {
    e.preventDefault();
    lastFocusable?.focus();
  } else if (!e.shiftKey && document.activeElement === lastFocusable) {
    e.preventDefault();
    firstFocusable?.focus();
  }
};

const activateFocusTrap = async () => {
  await nextTick();
  if (contentRef.value) {
    const focusable = contentRef.value.querySelector(focusableElements) as HTMLElement;
    focusable?.focus();
    document.addEventListener('keydown', trapFocus);
  }
};

const deactivateFocusTrap = () => {
  document.removeEventListener('keydown', trapFocus);
};

// Computed properties
const iconComponent = computed(() => {
  return variantIcons[props.variant];
});

const effectiveConfirmLabel = computed(
  () => props.confirmLabel || defaultConfirmLabels[props.variant],
);

const iconBgClass = computed(() => {
  const classes: Record<'success' | 'warning' | 'danger' | 'info', string> = {
    success: 'bg-green-500/15',
    warning: 'bg-amber-500/15',
    danger: 'bg-red-500/15',
    info: 'bg-blue-500/15',
  };
  return classes[props.variant];
});

const iconColorClass = computed(() => {
  const classes: Record<'success' | 'warning' | 'danger' | 'info', string> = {
    success: 'text-racing-success',
    warning: 'text-racing-warning',
    danger: 'text-racing-danger',
    info: 'text-racing-info',
  };
  return classes[props.variant];
});

const confirmButtonClass = computed(() => {
  const classes: Record<'success' | 'warning' | 'danger' | 'info', string> = {
    success: 'bg-racing-success hover:bg-green-500 text-racing-carbon transition-colors',
    warning: 'bg-racing-warning hover:bg-yellow-400 text-racing-carbon transition-colors',
    danger: 'bg-racing-danger hover:bg-red-500 text-racing-carbon transition-colors',
    info: 'bg-racing-info hover:bg-blue-500 text-racing-carbon transition-colors',
  };
  return classes[props.variant];
});

// Event handlers
const handleConfirm = () => {
  emit('confirm');
  emit('update:modelValue', false);
};

const handleCancel = () => {
  emit('cancel');
  emit('update:modelValue', false);
};

const handleEscape = (event: globalThis.KeyboardEvent) => {
  if (event.key === 'Escape' && props.modelValue) {
    handleCancel();
  }
};

// Expose for testing
defineExpose({
  resetOverlayCount,
});

// Prevent body scroll when dialog is open with proper stacking
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElement.value = document.activeElement as HTMLElement;

      // Increment overlay counter and lock body scroll if this is the first overlay
      const count = incrementOverlayCount();
      if (count === 1) {
        document.body.style.overflow = 'hidden';
      }

      // Activate focus trap after DOM updates
      await activateFocusTrap();
    } else {
      // Decrement overlay counter and restore body scroll only if all overlays are closed
      const count = decrementOverlayCount();
      if (count === 0) {
        document.body.style.overflow = '';
      }

      // Deactivate focus trap
      deactivateFocusTrap();

      // Return focus to previous element
      if (previousActiveElement.value) {
        previousActiveElement.value.focus();
      }
    }
  },
);

// Keyboard event listener
document.addEventListener('keydown', handleEscape);

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape);
  // Only decrement and restore if this dialog was open when unmounted
  if (props.modelValue) {
    const count = decrementOverlayCount();
    if (count === 0) {
      document.body.style.overflow = '';
    }
  }
  deactivateFocusTrap();
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="modelValue"
        ref="dialogRef"
        class="fixed inset-0 z-[100] flex items-center justify-center"
        style="
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        "
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
        @click.self="handleCancel"
      >
        <Transition
          enter-active-class="transition-all duration-200"
          leave-active-class="transition-all duration-200"
          enter-from-class="opacity-0 scale-95"
          leave-to-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-from-class="opacity-100 scale-100"
        >
          <div
            v-if="modelValue"
            ref="contentRef"
            class="w-[360px] max-w-[90vw] rounded-lg border p-6 text-center"
            style="background: var(--bg-secondary); border-color: var(--border-primary)"
          >
            <!-- Icon -->
            <div
              :class="[
                'mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full',
                iconBgClass,
              ]"
            >
              <component :is="iconComponent" :class="['text-2xl', iconColorClass]" weight="fill" />
            </div>

            <!-- Title -->
            <h2
              id="dialog-title"
              class="mb-2 font-display text-sm uppercase tracking-wide"
              style="color: var(--text-primary)"
            >
              {{ title }}
            </h2>

            <!-- Message -->
            <p id="dialog-message" class="mb-5 text-sm" style="color: var(--text-muted)">
              {{ message }}
            </p>

            <!-- Buttons -->
            <div v-if="confirmOnly" class="w-full">
              <button
                :class="[
                  'w-full rounded px-4 py-2.5 font-display text-xs uppercase tracking-wider',
                  confirmButtonClass,
                ]"
                @click="handleConfirm"
              >
                {{ effectiveConfirmLabel }}
              </button>
            </div>
            <div v-else class="flex gap-3">
              <button
                class="flex-1 rounded px-4 py-2.5 font-display text-xs uppercase tracking-wider transition-colors"
                style="background: var(--bg-tertiary); color: var(--text-muted)"
                @click="handleCancel"
              >
                {{ cancelLabel }}
              </button>
              <button
                :class="[
                  'flex-1 rounded px-4 py-2.5 font-display text-xs uppercase tracking-wider',
                  confirmButtonClass,
                ]"
                @click="handleConfirm"
              >
                {{ effectiveConfirmLabel }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
