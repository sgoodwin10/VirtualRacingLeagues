<script setup lang="ts">
/* global HTMLElement, TransitionEvent */
import { computed, watch, ref, onUnmounted, nextTick } from 'vue';
import { PhX } from '@phosphor-icons/vue';
import { onKeyStroke } from '@vueuse/core';
import { incrementOverlayCount, decrementOverlayCount, resetOverlayCount } from '../overlayState';

interface Props {
  modelValue: boolean;
  position?: 'left' | 'right';
  title?: string;
  closable?: boolean;
  width?: string;
}

const props = withDefaults(defineProps<Props>(), {
  position: 'right',
  title: undefined,
  closable: true,
  width: '400px',
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'close'): void;
}>();

const contentRef = ref<HTMLElement | null>(null);
const previousActiveElement = ref<HTMLElement | null>(null);
const titleId = 'drawer-title';
const messageId = 'drawer-message';

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

// Computed classes
const positionClasses = computed(() => {
  return props.position === 'left' ? 'left-0 border-r' : 'right-0 border-l';
});

const positionClass = computed(() => {
  return props.position === 'left' ? 'drawer-left' : 'drawer-right';
});

// Close handlers
const handleClose = () => {
  emit('update:modelValue', false);
  emit('close');
};

const handleOverlayClick = (e: MouseEvent) => {
  if (e.target === e.currentTarget) {
    handleClose();
  }
};

// Handle transition end for focus management
const handleTransitionEnd = (e: TransitionEvent) => {
  // Only handle the transform transition on the drawer content
  if (e.target === contentRef.value && e.propertyName === 'transform' && props.modelValue) {
    activateFocusTrap();
  }
};

// Escape key handler
onKeyStroke('Escape', (e) => {
  if (props.modelValue) {
    e.preventDefault();
    handleClose();
  }
});

// Expose for testing
defineExpose({
  resetOverlayCount,
});

// Body scroll lock with proper stacking
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

      // We'll activate focus trap via transitionend event
      // But if transitions are disabled, activate immediately
      if (contentRef.value) {
        contentRef.value.addEventListener('transitionend', handleTransitionEnd);
      }
    } else {
      // Decrement overlay counter and restore body scroll only if all overlays are closed
      const count = decrementOverlayCount();
      if (count === 0) {
        document.body.style.overflow = '';
      }

      // Deactivate focus trap
      deactivateFocusTrap();

      // Remove transition listener
      if (contentRef.value) {
        contentRef.value.removeEventListener('transitionend', handleTransitionEnd);
      }

      // Return focus to previous element
      if (previousActiveElement.value) {
        previousActiveElement.value.focus();
      }
    }
  },
  { immediate: false },
);

// Cleanup on unmount
onUnmounted(() => {
  // Only decrement and restore if this drawer was open when unmounted
  if (props.modelValue) {
    const count = decrementOverlayCount();
    if (count === 0) {
      document.body.style.overflow = '';
    }
  }
  deactivateFocusTrap();
  if (contentRef.value) {
    contentRef.value.removeEventListener('transitionend', handleTransitionEnd);
  }
});
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="modelValue" class="drawer-wrapper">
        <!-- Overlay -->
        <div class="drawer-overlay" role="presentation" @click="handleOverlayClick" />

        <!-- Drawer Content -->
        <div
          ref="contentRef"
          class="drawer-content"
          :class="[positionClasses, positionClass]"
          :style="{ width: width, maxWidth: '90vw' }"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title ? titleId : undefined"
          :aria-describedby="$slots.default ? messageId : undefined"
        >
          <!-- Header -->
          <div class="drawer-header">
            <slot name="header">
              <h2 v-if="title" :id="titleId" class="drawer-title">
                {{ title }}
              </h2>
            </slot>
            <button
              v-if="closable"
              type="button"
              class="drawer-close-btn"
              aria-label="Close drawer"
              @click="handleClose"
            >
              <PhX :size="20" weight="bold" />
            </button>
          </div>

          <!-- Body -->
          <div :id="messageId" class="drawer-body">
            <slot></slot>
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="drawer-footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Wrapper for z-index */
.drawer-wrapper {
  position: fixed;
  inset: 0;
  z-index: 100;
}

/* Overlay */
.drawer-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  transition: opacity 0.3s ease;
}

/* Drawer content */
.drawer-content {
  position: fixed;
  top: 0;
  bottom: 0;
  background: var(--bg-secondary);
  display: flex;
  flex-direction: column;
  border-color: var(--border-primary);
  transition: transform 0.3s ease;
}

/* Position classes */
.drawer-right {
  right: 0;
}

.drawer-left {
  left: 0;
}

/* Combined transition for enter/leave */
.drawer-enter-active,
.drawer-leave-active {
  /* Wrapper stays visible during transition */
}

.drawer-enter-active .drawer-overlay,
.drawer-leave-active .drawer-overlay {
  transition: opacity 0.3s ease;
}

.drawer-enter-active .drawer-content,
.drawer-leave-active .drawer-content {
  transition: transform 0.3s ease;
}

/* Enter from - overlay fades in, drawer slides in */
.drawer-enter-from .drawer-overlay {
  opacity: 0;
}

.drawer-enter-from .drawer-content.drawer-right {
  transform: translateX(100%);
}

.drawer-enter-from .drawer-content.drawer-left {
  transform: translateX(-100%);
}

/* Leave to - overlay fades out, drawer slides out */
.drawer-leave-to .drawer-overlay {
  opacity: 0;
}

.drawer-leave-to .drawer-content.drawer-right {
  transform: translateX(100%);
}

.drawer-leave-to .drawer-content.drawer-left {
  transform: translateX(-100%);
}

/* Header */
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-primary);
  padding: 1rem 1.25rem;
  flex-shrink: 0;
}

.drawer-title {
  font-family: var(--font-display);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.drawer-close-btn {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: 0.25rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.drawer-close-btn:hover {
  background: var(--gold-primary);
  border-color: var(--gold-primary);
  color: var(--bg-primary);
}

.drawer-close-btn:focus {
  outline: 2px solid var(--gold-primary);
  outline-offset: 2px;
}

/* Body */
.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
}

/* Footer */
.drawer-footer {
  border-top: 1px solid var(--border-primary);
  padding: 1rem 1.25rem;
  flex-shrink: 0;
}

/* Scrollbar styling for drawer body */
.drawer-body::-webkit-scrollbar {
  width: 8px;
}

.drawer-body::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
}

.drawer-body::-webkit-scrollbar-thumb {
  background: var(--border-primary);
  border-radius: 4px;
}

.drawer-body::-webkit-scrollbar-thumb:hover {
  background: var(--text-tertiary);
}
</style>
