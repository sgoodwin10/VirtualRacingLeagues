<script setup lang="ts">
import { computed } from 'vue';
import type { TagVariant } from '@public/types/components';

interface VrlTagProps {
  /**
   * Color variant of the tag
   * @default 'default'
   */
  variant?: TagVariant;
}

const props = withDefaults(defineProps<VrlTagProps>(), {
  variant: 'default',
});

/**
 * Compute tag variant classes
 */
const variantClasses = computed(() => {
  const variants: Record<TagVariant, string> = {
    default: 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]',
    cyan: 'bg-[var(--cyan-dim)] text-[var(--cyan)]',
    success: 'bg-[var(--green-dim)] text-[var(--green)]',
    warning: 'bg-[var(--orange-dim)] text-[var(--orange)]',
    danger: 'bg-[var(--red-dim)] text-[var(--red)]',
  };
  return variants[props.variant];
});
</script>

<template>
  <span
    :class="[
      'inline-flex items-center px-2 py-1 rounded-[var(--radius-sm)] font-[var(--font-body)] text-[0.7rem] font-medium leading-none whitespace-nowrap',
      variantClasses,
    ]"
  >
    <slot />
  </span>
</template>
