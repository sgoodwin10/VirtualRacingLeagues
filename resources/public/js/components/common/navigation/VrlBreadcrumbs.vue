<script setup lang="ts">
import { computed } from 'vue';
import VrlBreadcrumbItem from './VrlBreadcrumbItem.vue';
import type { BreadcrumbItem } from '@public/types/navigation';

/**
 * Props for the Breadcrumbs component
 */
interface Props {
  /**
   * Array of breadcrumb items to display
   * Supports 1-5 items (warning shown if > 5)
   */
  items: BreadcrumbItem[];
}

const props = defineProps<Props>();

/**
 * Validate that items array is within acceptable range
 */
const validatedItems = computed(() => {
  if (props.items.length === 0) {
    console.warn('VrlBreadcrumbs: items array is empty');
    return [];
  }
  if (props.items.length > 5) {
    console.warn('VrlBreadcrumbs: more than 5 items provided. Limiting to first 5 for usability.');
    return props.items.slice(0, 5);
  }
  return props.items;
});

/**
 * Check if a breadcrumb item is the last (active) item
 */
const isLastItem = (index: number): boolean => {
  return index === validatedItems.value.length - 1;
};
</script>

<template>
  <nav aria-label="Breadcrumb" class="flex items-center w-full" data-test="breadcrumbs">
    <ol class="flex items-center gap-2 list-none m-0 p-0 text-[0.85rem]">
      <li
        v-for="(item, index) in validatedItems"
        :key="`breadcrumb-${index}`"
        class="flex items-center gap-2"
        data-test="breadcrumb-item-wrapper"
      >
        <!-- Breadcrumb Item -->
        <VrlBreadcrumbItem
          :href="item.href"
          :to="item.to"
          :active="isLastItem(index)"
          :aria-current="isLastItem(index) ? 'page' : undefined"
        >
          {{ item.label }}
        </VrlBreadcrumbItem>

        <!-- Separator (not shown after last item) -->
        <span
          v-if="!isLastItem(index)"
          class="text-[var(--text-muted)]"
          aria-hidden="true"
          data-test="breadcrumb-separator"
        >
          <!-- Custom separator slot, defaults to "/" -->
          <slot name="separator">/</slot>
        </span>
      </li>
    </ol>
  </nav>
</template>
