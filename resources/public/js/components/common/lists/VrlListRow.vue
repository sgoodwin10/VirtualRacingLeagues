<script setup lang="ts">
/**
 * VrlListRow Component
 *
 * Main row component that composes indicator, content, stats, and action slots.
 * Supports clickable and hover states with full keyboard accessibility.
 */
import { computed } from 'vue';
import type { VrlListRowProps, VrlListRowEmits } from './types';
import VrlListRowIndicator from './VrlListRowIndicator.vue';

const props = withDefaults(defineProps<VrlListRowProps>(), {
  status: undefined,
  clickable: false,
  class: '',
  ariaLabel: undefined,
});

const emit = defineEmits<VrlListRowEmits>();

const containerClasses = computed(() => {
  const baseClasses = [
    'group',
    'flex',
    'items-center',
    'gap-4',
    'px-5',
    'py-4',
    'bg-[var(--bg-card)]',
    'border',
    'border-[var(--border)]',
    'rounded-[var(--radius)]',
    'transition-all',
    'duration-200',
    'hover:border-[var(--cyan)]',
    'hover:bg-[var(--bg-elevated)]',
    'focus-visible:outline',
    'focus-visible:outline-2',
    'focus-visible:outline-[var(--cyan)]',
    'focus-visible:outline-offset-2',
    'max-md:gap-3',
    'max-md:px-4',
    'max-md:py-3.5',
    'max-sm:gap-2',
    'max-sm:px-3',
    'max-sm:py-3',
  ];

  if (props.clickable) {
    baseClasses.push('cursor-pointer');
  }

  return baseClasses;
});

const handleClick = (event: MouseEvent) => {
  if (props.clickable) {
    emit('click', event);
  }
};

const handleKeydown = (event: KeyboardEvent) => {
  if (props.clickable && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    emit('click', event as unknown as MouseEvent);
  }
};
</script>

<template>
  <div
    :class="[containerClasses, props.class]"
    role="listitem"
    :aria-label="props.ariaLabel"
    :tabindex="props.clickable ? 0 : undefined"
    data-test="list-row"
    :data-clickable="props.clickable"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <!-- Indicator slot or default indicator -->
    <slot name="indicator">
      <VrlListRowIndicator v-if="props.status" :status="props.status" />
    </slot>

    <!-- Content slot -->
    <slot name="content" />

    <!-- Stats slot -->
    <slot name="stats" />

    <!-- Action slot -->
    <slot name="action" />
  </div>
</template>
