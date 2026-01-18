<script setup lang="ts">
import { computed } from 'vue';
import VrlSpinner from './VrlSpinner.vue';
import type { SpinnerSize } from '@public/types/loading';

interface Props {
  /** Show/hide overlay */
  visible: boolean;

  /** Loading message */
  message?: string;

  /** Spinner size */
  spinnerSize?: Exclude<SpinnerSize, 'sm'>;

  /** Overlay background opacity (0-1) */
  opacity?: number;

  /** Z-index value */
  zIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  message: undefined,
  spinnerSize: 'lg',
  opacity: 0.8,
  zIndex: 1000,
});

const overlayStyles = computed(() => ({
  backgroundColor: `rgba(13, 17, 23, ${props.opacity})`,
  zIndex: props.zIndex,
}));
</script>

<template>
  <Transition name="fade">
    <div
      v-if="visible"
      class="absolute inset-0 flex items-center justify-center backdrop-blur-sm"
      :style="overlayStyles"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loading-message"
      data-test="loading-overlay"
    >
      <div class="flex flex-col items-center gap-4" data-test="loading-overlay-content">
        <VrlSpinner :size="spinnerSize" />
        <p
          v-if="message"
          id="loading-message"
          class="font-body text-sm text-[rgb(var(--text-secondary))] m-0"
          data-test="loading-overlay-message"
        >
          {{ message }}
        </p>
      </div>
    </div>
  </Transition>
</template>
