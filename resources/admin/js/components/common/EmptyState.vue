<template>
  <div class="text-center py-8">
    <component :is="icon" :size="iconSize" :class="iconClass" class="mx-auto mb-3" />
    <p :class="messageClass">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { PhClock } from '@phosphor-icons/vue';
import type { Component } from 'vue';

/**
 * Props interface for EmptyState component
 */
export interface EmptyStateProps {
  /**
   * Custom icon component (should be a Phosphor icon)
   * @default PhClock
   */
  icon?: Component;

  /**
   * Message to display
   * @default 'No data found'
   */
  message?: string;

  /**
   * Size of the icon in pixels
   * @default 48
   */
  iconSize?: number;

  /**
   * Additional CSS classes for the icon
   * @default 'text-gray-400'
   */
  iconClass?: string;

  /**
   * Additional CSS classes for the message
   * @default 'text-gray-600'
   */
  messageClass?: string;
}

// Props with defaults
withDefaults(defineProps<EmptyStateProps>(), {
  icon: () => PhClock,
  message: 'No data found',
  iconSize: 48,
  iconClass: 'text-gray-400',
  messageClass: 'text-gray-600',
});
</script>
