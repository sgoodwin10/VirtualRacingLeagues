<script setup lang="ts">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

/**
 * Breadcrumb item interface
 */
export interface BreadcrumbItem {
  /**
   * The text label to display for this breadcrumb
   */
  label: string;

  /**
   * Optional route location for navigation (Vue Router format)
   * If not provided, the breadcrumb will be non-clickable (typically for the current page)
   */
  to?: RouteLocationRaw;

  /**
   * Optional PrimeIcons icon class (e.g., "pi-home", "pi-arrow-left")
   */
  icon?: string;
}

/**
 * Props for the Breadcrumbs component
 */
interface Props {
  /**
   * Array of breadcrumb items to display
   * Supports 1-5 items
   */
  items: BreadcrumbItem[];

  /**
   * Optional separator character or icon
   * @default "pi-chevron-right"
   */
  separator?: string;

  /**
   * Whether to use text separator instead of icon
   * @default false
   */
  textSeparator?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  separator: 'pi-chevron-right',
  textSeparator: false,
});

/**
 * Validate that items array is within acceptable range
 */
const validatedItems = computed(() => {
  if (props.items.length === 0) {
    console.warn('Breadcrumbs: items array is empty');
    return [];
  }
  if (props.items.length > 5) {
    console.warn('Breadcrumbs: more than 5 items provided, only first 5 will be displayed');
    return props.items.slice(0, 5);
  }
  return props.items;
});

/**
 * Check if a breadcrumb item is clickable
 */
const isClickable = (item: BreadcrumbItem, index: number): boolean => {
  // Last item is typically the current page and should not be clickable
  const isLastItem = index === validatedItems.value.length - 1;
  return !isLastItem && !!item.to;
};

/**
 * Get separator display based on configuration
 */
const separatorDisplay = computed(() => {
  if (props.textSeparator) {
    return props.separator;
  }
  return `pi ${props.separator}`;
});
</script>

<template>
  <nav aria-label="Breadcrumb" class="flex items-center gap-2 w-full">
    <ol class="flex items-center gap-2 list-none m-0 p-0">
      <li
        v-for="(item, index) in validatedItems"
        :key="`breadcrumb-${index}`"
        class="flex items-center gap-2"
      >
        <!-- Clickable Breadcrumb (router-link) -->
        <router-link
          v-if="isClickable(item, index)"
          :to="item.to!"
          class="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors duration-200 no-underline"
          :aria-current="index === validatedItems.length - 1 ? 'page' : undefined"
        >
          <i v-if="item.icon" :class="`pi ${item.icon}`" class="text-sm" aria-hidden="true"></i>
          <span class="font-medium">{{ item.label }}</span>
        </router-link>

        <!-- Non-clickable Breadcrumb (current page or no route) -->
        <span
          v-else
          class="flex items-center gap-2 text-gray-700"
          :aria-current="index === validatedItems.length - 1 ? 'page' : undefined"
        >
          <i v-if="item.icon" :class="`pi ${item.icon}`" class="text-sm" aria-hidden="true"></i>
          <span class="font-semibold">{{ item.label }}</span>
        </span>

        <!-- Separator (not shown after last item) -->
        <i
          v-if="index < validatedItems.length - 1 && !textSeparator"
          :class="separatorDisplay"
          class="text-gray-400 text-xs"
          aria-hidden="true"
        ></i>
        <span
          v-if="index < validatedItems.length - 1 && textSeparator"
          class="text-gray-400"
          aria-hidden="true"
        >
          {{ separator }}
        </span>
      </li>
    </ol>
  </nav>
</template>
