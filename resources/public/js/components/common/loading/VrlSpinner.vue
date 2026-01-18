<script setup lang="ts">
import { computed } from 'vue';
import type { SpinnerSize } from '@public/types/loading';

interface Props {
  /** Spinner size */
  size?: SpinnerSize;

  /** Accent color (CSS color value) */
  color?: string;

  /** Border thickness (CSS value) */
  thickness?: string;

  /** Center spinner in container */
  centered?: boolean;

  /** Loading message (accessibility) */
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'default',
  color: 'var(--cyan)',
  thickness: undefined,
  centered: false,
  label: 'Loading',
});

const spinnerStyles = computed(() => {
  const sizes: Record<SpinnerSize, { size: string; thickness: string }> = {
    sm: { size: '16px', thickness: '2px' },
    default: { size: '24px', thickness: '3px' },
    lg: { size: '40px', thickness: '4px' },
  };

  const { size: dimension, thickness: defaultThickness } = sizes[props.size];

  return {
    width: dimension,
    height: dimension,
    borderWidth: props.thickness || defaultThickness,
    borderTopColor: props.color,
  };
});
</script>

<template>
  <div v-if="centered" class="flex items-center justify-center min-h-[100px]">
    <div
      class="spinner"
      :style="spinnerStyles"
      role="status"
      :aria-label="label"
      data-test="spinner"
    >
      <span class="sr-only">{{ label }}</span>
    </div>
  </div>

  <div
    v-else
    class="spinner"
    :style="spinnerStyles"
    role="status"
    :aria-label="label"
    data-test="spinner"
  >
    <span class="sr-only">{{ label }}</span>
  </div>
</template>

<style scoped>
.spinner {
  display: inline-block;
  border-style: solid;
  border-color: rgb(var(--border));
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
    opacity: 0.6;
  }
}
</style>
