<template>
  <div class="text-center py-8">
    <component
      :is="icon"
      :size="iconSize"
      :class="[iconClass, { 'animate-spin': spin }]"
      class="mx-auto mb-3"
    />
    <p :class="messageClass">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
import { PhCircleNotch } from '@phosphor-icons/vue';
import type { Component } from 'vue';

/**
 * Props interface for LoadingState component
 */
export interface LoadingStateProps {
  /**
   * Custom icon component (should be a Phosphor icon)
   * @default PhCircleNotch
   */
  icon?: Component;

  /**
   * Message to display
   * @default 'Loading...'
   */
  message?: string;

  /**
   * Size of the icon in pixels
   * @default 48
   */
  iconSize?: number;

  /**
   * Whether to spin the icon
   * @default true
   */
  spin?: boolean;

  /**
   * Additional CSS classes for the icon
   * @default 'text-blue-500'
   */
  iconClass?: string;

  /**
   * Additional CSS classes for the message
   * @default 'text-gray-600'
   */
  messageClass?: string;
}

// Props with defaults
withDefaults(defineProps<LoadingStateProps>(), {
  icon: () => PhCircleNotch,
  message: 'Loading...',
  iconSize: 48,
  spin: true,
  iconClass: 'text-blue-500',
  messageClass: 'text-gray-600',
});
</script>
