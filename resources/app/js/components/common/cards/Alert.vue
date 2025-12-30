<script setup lang="ts">
import { computed } from 'vue';
import { PhCheckCircle, PhWarning, PhXCircle, PhInfo, PhX } from '@phosphor-icons/vue';
import type { AlertProps, AlertEmits } from './types';

const props = withDefaults(defineProps<AlertProps>(), {
  variant: 'info',
  dismissible: false,
});

const emit = defineEmits<AlertEmits>();

/**
 * Default icons for each variant
 */
const defaultIcon = computed(() => {
  const iconMap = {
    success: PhCheckCircle,
    warning: PhWarning,
    error: PhXCircle,
    info: PhInfo,
  };
  return iconMap[props.variant];
});

/**
 * Icon to display (custom or default)
 */
const displayIcon = computed(() => {
  return props.icon || defaultIcon.value;
});

/**
 * Handle dismiss action
 */
function handleDismiss(): void {
  emit('dismiss');
}
</script>

<template>
  <div
    :class="[
      'alert',
      `alert--${variant}`,
      'flex items-start gap-3 px-3.5 py-3 rounded-[var(--radius)] mb-3 text-md',
      props.class,
    ]"
    role="alert"
    :aria-live="variant === 'error' ? 'assertive' : 'polite'"
  >
    <!-- Icon -->
    <slot name="icon">
      <component
        :is="displayIcon"
        :size="18"
        weight="regular"
        class="flex-shrink-0"
        aria-hidden="true"
      />
    </slot>

    <!-- Content -->
    <div class="flex-1">
      <!-- Title -->
      <slot name="title">
        <div class="font-semibold mb-0.5">
          {{ title }}
        </div>
      </slot>

      <!-- Message -->
      <slot name="message">
        <slot>
          <div class="opacity-90">
            {{ message }}
          </div>
        </slot>
      </slot>
    </div>

    <!-- Dismiss Button -->
    <button
      v-if="dismissible"
      type="button"
      class="flex-shrink-0 p-0.5 hover:opacity-70 transition-opacity"
      :aria-label="`Dismiss ${variant} alert`"
      @click="handleDismiss"
    >
      <PhX :size="16" weight="bold" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
/* Success variant */
.alert--success {
  background: var(--green-dim);
  border: 1px solid rgba(126, 231, 135, 0.3);
  color: var(--green);
}

/* Warning variant */
.alert--warning {
  background: var(--orange-dim);
  border: 1px solid rgba(240, 136, 62, 0.3);
  color: var(--orange);
}

/* Error variant */
.alert--error {
  background: var(--red-dim);
  border: 1px solid rgba(248, 81, 73, 0.3);
  color: var(--red);
}

/* Info variant */
.alert--info {
  background: var(--cyan-dim);
  border: 1px solid rgba(88, 166, 255, 0.3);
  color: var(--cyan);
}
</style>
