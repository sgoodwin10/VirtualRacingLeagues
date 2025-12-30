<script setup lang="ts">
/**
 * ListRow Component
 *
 * Main row component for lists.
 * Supports status indicators, hover effects, click events, and keyboard accessibility.
 */
import { computed } from 'vue';
import type { ListRowProps, ListRowEmits } from './types';
import ListRowIndicator from './ListRowIndicator.vue';

const props = withDefaults(defineProps<ListRowProps>(), {
  status: undefined,
  showIndicator: undefined,
  clickable: false,
  noHover: false,
  class: '',
  ariaLabel: undefined,
});

const emit = defineEmits<ListRowEmits>();

const shouldShowIndicator = computed(() => {
  if (props.showIndicator !== undefined) {
    return props.showIndicator;
  }
  return props.status !== undefined;
});

const containerClasses = computed(() => {
  const classes = [
    'flex items-center gap-3',
    'px-4 py-3',
    'rounded-[var(--radius)]',
    'border border-[var(--border)]',
    'bg-[var(--bg-card)]',
    'transition-all duration-200',
    'motion-reduce:transition-none motion-reduce:transform-none',
  ];

  if (!props.noHover) {
    classes.push('hover:border-[var(--cyan)]', 'hover:translate-x-1');
  }

  if (props.clickable) {
    classes.push(
      'cursor-pointer',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-[var(--cyan)]',
    );
  }

  return classes;
});

const handleClick = (event: MouseEvent) => {
  if (props.clickable) {
    emit('click', event);
  }
};

// eslint-disable-next-line no-undef
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
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <!-- Indicator slot or default indicator -->
    <slot name="indicator">
      <ListRowIndicator v-if="shouldShowIndicator && props.status" :status="props.status" />
    </slot>

    <!-- Main content -->
    <div class="flex-1 min-w-0">
      <slot />
    </div>

    <!-- Stats slot -->
    <div v-if="$slots.stats" class="flex-shrink-0">
      <slot name="stats" />
    </div>

    <!-- Action slot -->
    <div v-if="$slots.action" class="flex-shrink-0">
      <slot name="action" />
    </div>
  </div>
</template>
