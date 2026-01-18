<script setup lang="ts">
import { computed, useSlots } from 'vue';
import type { StatusType } from '@public/types/components';

interface VrlStatusIndicatorProps {
  /**
   * Status type to display
   * @default 'inactive'
   */
  status?: StatusType;
}

const props = withDefaults(defineProps<VrlStatusIndicatorProps>(), {
  status: 'inactive',
});

const slots = useSlots();

/**
 * Status configuration mapping
 */
const STATUS_MAP: Record<StatusType, { color: string; label: string }> = {
  active: { color: 'green', label: 'Active' },
  pending: { color: 'orange', label: 'Pending' },
  inactive: { color: 'muted', label: 'Inactive' },
  error: { color: 'red', label: 'Error' },
};

/**
 * Get status configuration
 */
const statusConfig = computed(() => STATUS_MAP[props.status]);

/**
 * Get display label (slot content or default)
 */
const displayLabel = computed(() => {
  const hasSlotContent = slots.default && slots.default().length > 0;
  return hasSlotContent ? null : statusConfig.value.label;
});

/**
 * Compute status dot color classes
 */
const dotClasses = computed(() => {
  const colors: Record<StatusType, string> = {
    active: 'bg-[var(--green)]',
    pending: 'bg-[var(--orange)]',
    inactive: 'bg-[var(--text-muted)]',
    error: 'bg-[var(--red)]',
  };
  return colors[props.status];
});
</script>

<template>
  <span
    class="inline-flex items-center gap-2 font-[var(--font-body)] text-[0.8rem] font-medium leading-none"
  >
    <span :class="['w-2 h-2 rounded-full flex-shrink-0', dotClasses]" />
    <span class="leading-none text-[var(--text-primary)]">
      <slot>{{ displayLabel }}</slot>
    </span>
  </span>
</template>
