<template>
  <span :class="['inline-flex items-center rounded-full font-medium', sizeClasses, variantClasses]">
    <i v-if="icon" :class="['pi', icon, iconSizeClass, 'mr-1.5']"></i>
    {{ text }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

/**
 * Badge variant types
 */
export type BadgeVariant =
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'primary'
  | 'secondary'
  | 'purple';

/**
 * Badge size types
 */
export type BadgeSize = 'sm' | 'md';

/**
 * Props interface for Badge component
 */
export interface BadgeProps {
  /**
   * The text to display in the badge
   */
  text: string;

  /**
   * The color variant of the badge
   * @default 'secondary'
   */
  variant?: BadgeVariant;

  /**
   * Optional PrimeIcons icon class (e.g., 'pi-circle-fill')
   */
  icon?: string;

  /**
   * The size of the badge
   * @default 'md'
   */
  size?: BadgeSize;
}

// Props with defaults
const props = withDefaults(defineProps<BadgeProps>(), {
  variant: 'secondary',
  size: 'md',
});

/**
 * Get variant-specific CSS classes
 */
const variantClasses = computed<string>(() => {
  const variants: Record<BadgeVariant, string> = {
    success: 'bg-green-100 text-green-700',
    info: 'bg-blue-100 text-blue-700',
    primary: 'bg-blue-100 text-blue-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    secondary: 'bg-gray-100 text-gray-700',
    purple: 'bg-purple-100 text-purple-700',
  };

  return variants[props.variant] || variants.secondary;
});

/**
 * Get size-specific CSS classes
 */
const sizeClasses = computed<string>(() => {
  const sizes: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  return sizes[props.size];
});

/**
 * Get icon size class based on badge size
 */
const iconSizeClass = computed<string>(() => {
  const iconSizes: Record<BadgeSize, string> = {
    sm: 'text-[8px]',
    md: 'text-[10px]',
  };

  return iconSizes[props.size];
});
</script>

<style scoped>
/* Badge component styles */
</style>
