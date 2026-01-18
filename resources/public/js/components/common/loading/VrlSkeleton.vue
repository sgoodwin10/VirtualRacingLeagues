<script setup lang="ts">
import { computed } from 'vue';
import type { SkeletonType } from '@public/types/loading';

interface Props {
  /** Predefined skeleton type */
  type?: SkeletonType;

  /** Custom width (CSS value: px, %, rem, etc.) */
  width?: string;

  /** Custom height (CSS value: px, %, rem, etc.) */
  height?: string;

  /** Custom border radius (CSS value) */
  borderRadius?: string;

  /** Additional CSS classes */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'custom',
  width: '100%',
  height: '20px',
  borderRadius: 'var(--radius)',
  class: '',
});

const skeletonStyles = computed(() => {
  if (props.type === 'custom') {
    return {
      width: props.width,
      height: props.height,
      borderRadius: props.borderRadius,
    };
  }

  // Return preset dimensions based on type
  const presets: Record<
    Exclude<SkeletonType, 'custom'>,
    { width: string; height: string; borderRadius: string }
  > = {
    text: { width: '100%', height: '14px', borderRadius: 'var(--radius)' },
    title: { width: '40%', height: '20px', borderRadius: 'var(--radius)' },
    avatar: { width: '40px', height: '40px', borderRadius: 'var(--radius)' },
    card: { width: '100%', height: '120px', borderRadius: 'var(--radius-md)' },
  };

  return presets[props.type];
});
</script>

<template>
  <div
    class="skeleton"
    :class="props.class"
    :style="skeletonStyles"
    role="status"
    aria-live="polite"
    aria-label="Loading content"
    data-test="skeleton"
  />
</template>

<style scoped>
.skeleton {
  background: linear-gradient(
    90deg,
    rgb(var(--bg-elevated)) 25%,
    rgb(var(--bg-highlight)) 50%,
    rgb(var(--bg-elevated)) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
    background: rgb(var(--bg-elevated));
  }
}
</style>
