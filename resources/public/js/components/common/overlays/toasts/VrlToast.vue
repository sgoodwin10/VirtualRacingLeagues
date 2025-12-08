<script setup lang="ts">
import { computed } from 'vue';
import Toast from 'primevue/toast';
import { PhCheckCircle, PhXCircle, PhWarning, PhInfo, PhX } from '@phosphor-icons/vue';
import type { ToastPassThroughOptions } from 'primevue/toast';

interface Props {
  position?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
  life?: number;
}

withDefaults(defineProps<Props>(), {
  position: 'top-right',
  life: 5000,
});

const passthrough = computed<ToastPassThroughOptions>(() => ({
  root: {
    class: 'vrl-toast-container',
  },
  container: ({ props: toastProps }: { props: { message: { severity: string } } }) => ({
    class: [
      'vrl-toast',
      `vrl-toast-${toastProps.message.severity}`,
      'flex items-center gap-3 px-4 py-3 rounded',
    ],
  }),
  content: {
    class: 'vrl-toast-content flex items-center gap-3 flex-1',
  },
  icon: {
    class: 'vrl-toast-icon-wrapper',
  },
  text: {
    class: 'vrl-toast-text flex-1',
  },
  summary: {
    class: 'vrl-toast-summary font-medium text-sm',
  },
  detail: {
    class: 'vrl-toast-detail text-sm',
  },
  buttonContainer: {
    class: 'vrl-toast-button-container',
  },
  closeButton: {
    class: 'vrl-toast-close-button',
  },
  closeIcon: {
    class: 'vrl-toast-close-icon text-sm',
  },
}));

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'success':
      return PhCheckCircle;
    case 'error':
      return PhXCircle;
    case 'warn':
      return PhWarning;
    case 'info':
      return PhInfo;
    default:
      return PhInfo;
  }
};
</script>

<template>
  <Toast :position="position" :life="life" :pt="passthrough">
    <template
      #message="slotProps: {
        message: { severity: string; summary?: string; detail: string };
        closeCallback: () => void;
      }"
    >
      <div class="flex items-center gap-3 w-full">
        <component
          :is="getSeverityIcon(slotProps.message.severity)"
          weight="fill"
          class="text-lg vrl-toast-icon"
          :class="{
            'text-racing-success': slotProps.message.severity === 'success',
            'text-racing-danger': slotProps.message.severity === 'error',
            'text-racing-warning': slotProps.message.severity === 'warn',
            'text-racing-info': slotProps.message.severity === 'info',
          }"
        />
        <div class="flex-1">
          <div
            v-if="slotProps.message.summary"
            class="font-medium text-sm"
            style="color: var(--text-primary)"
          >
            {{ slotProps.message.summary }}
          </div>
          <div class="text-sm" style="color: var(--text-primary)">
            {{ slotProps.message.detail }}
          </div>
        </div>
        <button
          type="button"
          class="vrl-toast-close-button"
          aria-label="Close notification"
          @click="slotProps.closeCallback"
        >
          <PhX class="text-sm" />
        </button>
      </div>
    </template>
  </Toast>
</template>

<style scoped>
.vrl-toast-container {
  width: 25rem;
  max-width: calc(100vw - 2rem);
}

.vrl-toast {
  margin-bottom: 0.75rem;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.vrl-toast-success {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.vrl-toast-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.vrl-toast-warn {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.vrl-toast-info {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.vrl-toast-close-button {
  color: var(--text-muted);
  transition: color 0.2s;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.vrl-toast-close-button:hover {
  color: var(--racing-gold);
}

.vrl-toast-close-button:focus-visible {
  outline: 2px solid var(--racing-gold);
  outline-offset: 2px;
  border-radius: 0.25rem;
}
</style>
