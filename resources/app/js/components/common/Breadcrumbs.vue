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
}

const props = defineProps<Props>();

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
</script>

<template>
  <nav aria-label="Breadcrumb" class="breadcrumb">
    <ol class="breadcrumb-list">
      <li
        v-for="(item, index) in validatedItems"
        :key="`breadcrumb-${index}`"
        class="breadcrumb-item-wrapper"
      >
        <!-- Clickable Breadcrumb (router-link) -->
        <router-link
          v-if="isClickable(item, index)"
          :to="item.to!"
          class="breadcrumb-link"
          :aria-current="index === validatedItems.length - 1 ? 'page' : undefined"
        >
          {{ item.label }}
        </router-link>

        <!-- Non-clickable Breadcrumb (current page or no route) -->
        <span
          v-else
          class="breadcrumb-current"
          :aria-current="index === validatedItems.length - 1 ? 'page' : undefined"
        >
          {{ item.label }}
        </span>

        <!-- Separator (not shown after last item) -->
        <span v-if="index < validatedItems.length - 1" class="breadcrumb-sep" aria-hidden="true">
          /
        </span>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.breadcrumb {
  display: flex;
  align-items: center;
  width: 100%;
  font-family: var(--font-mono);
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0;

  font-size: 12px;
}

.breadcrumb-item-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb-link {
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.2s ease-in-out;
}

.breadcrumb-link:hover {
  color: var(--text-secondary);
}

.breadcrumb-current {
  color: var(--text-primary);
}

.breadcrumb-sep {
  color: var(--text-muted);
}
</style>
