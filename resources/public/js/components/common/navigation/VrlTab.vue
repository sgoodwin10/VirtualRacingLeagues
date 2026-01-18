<script setup lang="ts">
import { computed } from 'vue';

/**
 * Props for individual tab button (internal sub-component)
 */
interface Props {
  /** Whether this tab is currently active */
  active?: boolean;

  /** Whether this tab is disabled */
  disabled?: boolean;

  /** Optional Phosphor icon name */
  icon?: string;
}

const props = defineProps<Props>();

/**
 * Emits
 */
interface Emits {
  /** Tab clicked event */
  (e: 'click'): void;
}

const emit = defineEmits<Emits>();

/**
 * Handle click event
 */
const handleClick = () => {
  if (!props.disabled) {
    emit('click');
  }
};

/**
 * Get computed classes for tab button
 */
const tabClasses = computed(() => {
  const classes = [
    'flex',
    'items-center',
    'gap-2',
    'py-2',
    'px-4',
    'font-[family-name:var(--font-display)]',
    'text-xs',
    'font-semibold',
    'tracking-[0.5px]',
    'border',
    'border-transparent',
    'rounded-[var(--radius-sm)]',
    'cursor-pointer',
    'transition-[var(--transition)]',
    'whitespace-nowrap',
  ];

  if (props.active) {
    classes.push('bg-[var(--cyan)]', 'text-[var(--bg-dark)]', 'border-[var(--cyan)]');
  } else if (props.disabled) {
    classes.push(
      'opacity-50',
      'cursor-not-allowed',
      'text-[var(--text-secondary)]',
      'bg-transparent',
    );
  } else {
    classes.push(
      'text-[var(--text-secondary)]',
      'bg-transparent',
      'hover:text-[var(--text-primary)]',
      'hover:bg-[var(--bg-card)]',
    );
  }

  return classes.join(' ');
});
</script>

<template>
  <button
    type="button"
    :class="tabClasses"
    :disabled="disabled"
    data-test="tab"
    @click="handleClick"
  >
    <!-- Icon (if provided) -->
    <i v-if="icon" :class="`ph ph-${icon}`" class="text-base"></i>

    <!-- Tab label content -->
    <slot />
  </button>
</template>
