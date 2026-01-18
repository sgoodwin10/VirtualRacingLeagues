<script setup lang="ts">
import { computed } from 'vue';
import type { SkeletonSize, SkeletonShape } from '@public/types/loading';

interface Props {
  /** Avatar size variant */
  size?: SkeletonSize;

  /** Avatar shape */
  shape?: SkeletonShape;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  shape: 'circle',
});

const avatarStyles = computed(() => {
  const sizes: Record<SkeletonSize, string> = {
    sm: '32px',
    md: '40px',
    lg: '56px',
    xl: '72px',
  };

  const borderRadii: Record<SkeletonShape, string | Record<SkeletonSize, string>> = {
    circle: '50%',
    square: {
      sm: 'var(--radius-sm)',
      md: 'var(--radius)',
      lg: 'var(--radius-md)',
      xl: 'var(--radius-lg)',
    },
  };

  const dimension = sizes[props.size];
  const radius =
    props.shape === 'circle'
      ? (borderRadii.circle as string)
      : (borderRadii.square as Record<SkeletonSize, string>)[props.size];

  return {
    width: dimension,
    height: dimension,
    borderRadius: radius,
  };
});
</script>

<template>
  <div
    class="skeleton shrink-0"
    :style="avatarStyles"
    role="status"
    aria-label="Loading avatar"
    data-test="skeleton-avatar"
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
