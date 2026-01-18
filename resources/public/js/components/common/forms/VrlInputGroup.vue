<script setup lang="ts">
import { computed } from 'vue';

/**
 * VrlInputGroup Component
 *
 * Grid layout component for grouping multiple inputs horizontally with responsive behavior.
 *
 * Features:
 * - Grid layout with configurable columns (2, 3, or 4)
 * - Responsive design that stacks on mobile
 * - Customizable gap between inputs
 * - Slot-based composition
 *
 * @example
 * Basic usage (2 columns):
 * <VrlInputGroup :columns="2">
 *   <VrlInput v-model="firstName" label="First Name" />
 *   <VrlInput v-model="lastName" label="Last Name" />
 * </VrlInputGroup>
 *
 * @example
 * Three columns with custom gap:
 * <VrlInputGroup :columns="3" gap="1.5rem">
 *   <VrlInput v-model="day" label="Day" />
 *   <VrlInput v-model="month" label="Month" />
 *   <VrlInput v-model="year" label="Year" />
 * </VrlInputGroup>
 *
 * @example
 * Four columns:
 * <VrlInputGroup :columns="4">
 *   <VrlInput v-model="q1" label="Q1" />
 *   <VrlInput v-model="q2" label="Q2" />
 *   <VrlInput v-model="q3" label="Q3" />
 *   <VrlInput v-model="q4" label="Q4" />
 * </VrlInputGroup>
 */

interface Props {
  /** Number of columns in the grid layout */
  columns?: 2 | 3 | 4;
  /** Gap between grid items (CSS value) */
  gap?: string;
  /** Additional CSS classes */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  columns: 2,
  gap: '1rem',
  class: '',
});

defineSlots<{
  /** Default slot for input components */
  default(): unknown;
}>();

/**
 * Compute the grid class based on columns prop
 */
const gridClass = computed(() => {
  const columnClass =
    props.columns === 2 ? 'grid-cols-2' : props.columns === 3 ? 'grid-cols-3' : 'grid-cols-4';
  return `grid ${columnClass} max-md:grid-cols-1`;
});

/**
 * Compute inline styles for custom gap
 */
const gridStyle = computed(() => {
  return {
    gap: props.gap,
  };
});
</script>

<template>
  <div :class="[gridClass, props.class]" :style="gridStyle">
    <slot />
  </div>
</template>
