<script setup lang="ts">
/* global HTMLElement */
import { computed, watch, onUnmounted, ref, nextTick } from 'vue';
import { PhX } from '@phosphor-icons/vue';
import { onKeyStroke } from '@vueuse/core';
import { resetModalCount, incrementModalCount, decrementModalCount } from './modalState';

interface Props {
  modelValue: boolean; // Visible state (v-model)
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean; // Default true
  closeOnEscape?: boolean; // Default true
  modal?: boolean; // Show backdrop, default true
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  size: 'md',
  closable: true,
  closeOnEscape: true,
  modal: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  close: [];
}>();

const modalRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const previousActiveElement = ref<HTMLElement | null>(null);

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

// Size classes
const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'vrl-modal--sm';
    case 'md':
      return 'vrl-modal--md';
    case 'lg':
      return 'vrl-modal--lg';
    case 'xl':
      return 'vrl-modal--xl';
    case 'full':
      return 'vrl-modal--full';
    default:
      return 'vrl-modal--md';
  }
});

// Close handlers
const handleClose = () => {
  emit('update:modelValue', false);
  emit('close');
};

const handleBackdropClick = (event: MouseEvent) => {
  if (props.modal && event.target === modalRef.value) {
    handleClose();
  }
};

const handleEscapeKey = () => {
  if (props.closeOnEscape && props.modelValue) {
    handleClose();
  }
};

// Keyboard events
onKeyStroke('Escape', handleEscapeKey);

// Expose for testing
defineExpose({
  resetModalCount,
});

// Prevent body scroll when modal is open
watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElement.value = document.activeElement as HTMLElement;

      // Increment modal counter and lock body scroll if this is the first modal
      const count = incrementModalCount();
      if (count === 1) {
        document.body.style.overflow = 'hidden';
      }

      // Activate focus trap after DOM updates
      await activateFocusTrap();
    } else {
      // Decrement modal counter and restore body scroll only if all modals are closed
      const count = decrementModalCount();
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

// Cleanup on unmount
onUnmounted(() => {
  // Only decrement and restore if this modal was open when unmounted
  if (props.modelValue) {
    const count = decrementModalCount();
    if (count === 0) {
      document.body.style.overflow = '';
    }
  }
  deactivateFocusTrap();
});
</script>

<template>
  <Teleport to="body">
    <Transition name="vrl-modal-overlay">
      <div
        v-if="modelValue"
        ref="modalRef"
        class="vrl-modal-overlay"
        :aria-modal="modal"
        role="dialog"
        :aria-labelledby="title ? 'vrl-modal-title' : undefined"
        @click="handleBackdropClick"
      >
        <Transition name="vrl-modal-content">
          <div
            v-if="modelValue"
            ref="contentRef"
            class="vrl-modal-content"
            :class="sizeClasses"
            @click.stop
          >
            <!-- Header -->
            <div v-if="$slots.header || title || closable" class="vrl-modal-header">
              <slot name="header">
                <h2 v-if="title" id="vrl-modal-title" class="vrl-modal-title">
                  {{ title }}
                </h2>
              </slot>
              <button
                v-if="closable"
                type="button"
                class="vrl-modal-close"
                aria-label="Close modal"
                @click="handleClose"
              >
                <PhX :size="16" weight="bold" />
              </button>
            </div>

            <!-- Body -->
            <div class="vrl-modal-body">
              <slot />
            </div>

            <!-- Footer -->
            <div v-if="$slots.footer" class="vrl-modal-footer">
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Overlay */
.vrl-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

/* Content */
.vrl-modal-content {
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Sizes */
.vrl-modal--sm {
  width: 400px;
}

.vrl-modal--md {
  width: 500px;
}

.vrl-modal--lg {
  width: 700px;
}

.vrl-modal--xl {
  width: 900px;
}

.vrl-modal--full {
  width: calc(100vw - 2rem);
  height: calc(100vh - 2rem);
  max-width: calc(100vw - 2rem);
  max-height: calc(100vh - 2rem);
}

/* Header */
.vrl-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-primary);
  gap: 1rem;
}

.vrl-modal-title {
  font-family: var(--font-display);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-primary);
  margin: 0;
  font-weight: 600;
}

.vrl-modal-close {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 0.375rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.vrl-modal-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.vrl-modal-close:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Body */
.vrl-modal-body {
  padding: 1.25rem;
  overflow-y: auto;
  flex: 1;
  color: var(--text-primary);
}

/* Footer */
.vrl-modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--border-primary);
  background: var(--bg-primary);
}

/* Transitions */
.vrl-modal-overlay-enter-active,
.vrl-modal-overlay-leave-active {
  transition: opacity 0.3s ease;
}

.vrl-modal-overlay-enter-from,
.vrl-modal-overlay-leave-to {
  opacity: 0;
}

.vrl-modal-content-enter-active,
.vrl-modal-content-leave-active {
  transition: all 0.3s ease;
}

.vrl-modal-content-enter-from,
.vrl-modal-content-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
