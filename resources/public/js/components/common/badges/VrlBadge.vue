<script setup lang="ts">
import { computed } from 'vue';
import type { BadgeVariant } from '@public/types/components';

interface VrlBadgeProps {
  /**
   * Color variant of the badge
   * @default 'default'
   */
  variant?: BadgeVariant;

  /**
   * Display a colored dot before the text
   * @default false
   */
  dot?: boolean;

  /**
   * Animate the dot with pulsing effect
   * Only works when dot is true
   * @default false
   */
  pulse?: boolean;
}

const props = withDefaults(defineProps<VrlBadgeProps>(), {
  variant: 'default',
  dot: false,
  pulse: false,
});

// Development warning for invalid pulse usage
if (import.meta.env.DEV && props.pulse && !props.dot) {
  console.warn('VrlBadge: pulse prop has no effect when dot is false');
}

/**
 * Compute badge variant classes
 */
const variantClasses = computed(() => {
  const variants: Record<BadgeVariant, string> = {
    default: 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]',
    cyan: 'bg-[var(--cyan-dim)] text-[var(--cyan)]',
    green: 'bg-[var(--green-dim)] text-[var(--green)]',
    orange: 'bg-[var(--orange-dim)] text-[var(--orange)]',
    red: 'bg-[var(--red-dim)] text-[var(--red)]',
    purple: 'bg-[var(--purple-dim)] text-[var(--purple)]',
  };
  return variants[props.variant];
});
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-pill)] font-[var(--font-display)] text-[0.7rem] font-semibold tracking-wider uppercase whitespace-nowrap',
      variantClasses,
      {
        'badge-dot': dot,
        pulse: dot && pulse,
      },
    ]"
  >
    <slot />
  </span>
</template>

<style scoped>
/* Badge dot (using ::before pseudo-element) */
.badge-dot::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

/* Pulse animation */
.badge-dot.pulse::before {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  .badge-dot.pulse::before {
    animation: none;
  }
}
</style>
