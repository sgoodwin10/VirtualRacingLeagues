<script setup lang="ts">
import type { Component } from 'vue';

/**
 * PanelHeader Component
 *
 * A reusable header component for BasePanel that provides consistent styling
 * across different panel types. Supports icons, titles, descriptions, and
 * gradient backgrounds.
 *
 * @example
 * ```vue
 * <!-- Simple header -->
 * <PanelHeader title="Description" />
 *
 * <!-- With icon -->
 * <PanelHeader
 *   :icon="PhTrophy"
 *   icon-class="text-amber-600"
 *   title="Season Standings"
 * />
 *
 * <!-- With gradient and description -->
 * <PanelHeader
 *   :icon="PhTrophy"
 *   icon-class="text-purple-600"
 *   title="Divisions"
 *   description="Skill-based groupings for fair competition within division championships"
 *   gradient="from-purple-50 to-blue-50"
 * />
 *
 * <!-- Half-width panel (for grid layouts) -->
 * <PanelHeader
 *   :icon="PhUsersThree"
 *   icon-class="text-blue-600"
 *   title="Teams"
 *   description="Multi-division organizations competing for the team championship"
 *   gradient="from-blue-50 to-indigo-50"
 *   half-width
 *   border-right
 * />
 * ```
 */

interface Props {
  /** Phosphor icon component */
  icon?: Component;
  /** Icon size in pixels */
  iconSize?: number;
  /** Icon weight (from Phosphor) */
  iconWeight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  /** Custom CSS classes for the icon (e.g., 'text-purple-600') */
  iconClass?: string;
  /** Header title text */
  title: string;
  /** Optional description text */
  description?: string;
  /** Tailwind gradient classes (e.g., 'from-purple-50 to-blue-50') */
  gradient?: string;
  /** Whether this panel is in a half-width grid layout */
  halfWidth?: boolean;
  /** Add border on the right side (useful for grid layouts) */
  borderRight?: boolean;
}

withDefaults(defineProps<Props>(), {
  icon: undefined,
  iconSize: 24,
  iconWeight: 'fill',
  iconClass: 'text-gray-700',
  description: undefined,
  gradient: undefined,
  halfWidth: false,
  borderRight: false,
});
</script>

<template>
  <div
    :class="[
      'flex items-center gap-3 border-b border-gray-200 w-full',
      {
        'py-3 px-4': description || gradient,
        'py-2 mx-4': !description && !gradient,
        [`bg-gradient-to-r ${gradient}`]: gradient,
        'border-r': borderRight,
      },
    ]"
  >
    <!-- Icon -->
    <component :is="icon" v-if="icon" :size="iconSize" :weight="iconWeight" :class="iconClass" />

    <!-- Title and Description -->
    <div class="flex-1">
      <h3
        v-if="description"
        :class="['font-semibold', { 'text-gray-900': gradient, 'text-surface-700': !gradient }]"
      >
        {{ title }}
      </h3>
      <span
        v-else
        :class="['font-medium', { 'text-gray-900': gradient, 'text-surface-700': !gradient }]"
      >
        {{ title }}
      </span>
      <p v-if="description" class="text-sm text-gray-600 mt-0.5">
        {{ description }}
      </p>
    </div>
  </div>
</template>
