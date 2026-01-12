<script setup lang="ts">
import { computed } from 'vue';
import type { CardHeaderProps } from './types';

const props = defineProps<CardHeaderProps>();

/**
 * Compute gradient background classes
 */
const gradientClasses = computed(() => {
  if (!props.gradientFrom || !props.gradientTo) {
    return '';
  }
  return `bg-gradient-to-br from-${props.gradientFrom} to-${props.gradientTo}`;
});

/**
 * Compute icon color classes
 */
const iconColorClasses = computed(() => {
  if (!props.iconColor) {
    return 'text-[var(--text-secondary)]';
  }
  return `text-${props.iconColor}`;
});
</script>

<template>
  <div :class="['flex items-center justify-between pl-2 pr-[12px] py-[10px]', props.class]">
    <!-- Header Content -->
    <div class="flex items-center gap-3">
      <!-- Icon Container (if icon or icon slot provided) -->
      <div
        v-if="icon || $slots.icon"
        :class="[
          'flex h-10 w-10 items-center justify-center rounded-lg',
          gradientClasses ||
            'border border-[var(--color-border-highlight)] bg-[var(--bg-highlight)]',
        ]"
      >
        <slot name="icon">
          <component :is="icon" v-if="icon" :size="20" :class="iconColorClasses" />
        </slot>
      </div>

      <!-- Title and Description -->
      <div>
        <slot>
          <h2
            v-if="title"
            class="font-mono text-sm font-semibold tracking-wide text-[var(--text-primary)]"
          >
            {{ title }}
          </h2>
          <p v-if="description" class="text-sm text-[var(--text-secondary)]">
            {{ description }}
          </p>
        </slot>
      </div>
    </div>

    <!-- Header Actions -->
    <div v-if="$slots.actions">
      <slot name="actions" />
    </div>
  </div>
</template>
