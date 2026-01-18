<script setup lang="ts">
import { computed } from 'vue';

/**
 * VrlTablePagination - Custom pagination component for VRL Velocity design system
 *
 * Provides numbered page buttons with info text showing current range.
 * Replaces default PrimeVue pagination with VRL-styled controls.
 *
 * @example
 * ```vue
 * <VrlTablePagination
 *   :current-page="3"
 *   :total-pages="10"
 *   :total-items="100"
 *   :items-per-page="10"
 *   :first="20"
 *   :last="29"
 *   entity-name="drivers"
 *   @page-change="handlePageChange"
 *   @prev="handlePrev"
 *   @next="handleNext"
 * />
 * ```
 */
interface VrlTablePaginationProps {
  /** Current page number (1-indexed) */
  currentPage: number;

  /** Total number of pages */
  totalPages: number;

  /** Total number of items */
  totalItems: number;

  /** Items per page */
  itemsPerPage: number;

  /** First item index (0-indexed) */
  first: number;

  /** Last item index (0-indexed) */
  last: number;

  /** Entity name for display text (e.g., 'drivers', 'teams') */
  entityName?: string;
}

const props = withDefaults(defineProps<VrlTablePaginationProps>(), {
  entityName: 'records',
});

interface VrlTablePaginationEmits {
  (e: 'page-change', page: number): void; // Page number (0-indexed)
  (e: 'prev'): void;
  (e: 'next'): void;
}

const emit = defineEmits<VrlTablePaginationEmits>();

/**
 * Calculate visible page numbers (max 5 buttons)
 */
const visiblePages = computed(() => {
  const pages: number[] = [];
  const maxVisible = 5;
  let start = Math.max(1, props.currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(props.totalPages, start + maxVisible - 1);

  // Adjust start if we're at the end
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
});

/**
 * Pagination info text
 */
const paginationInfo = computed(() => {
  const firstItem = props.first + 1;
  const lastItem = props.last + 1; // Convert from 0-indexed to 1-indexed
  return `Showing ${firstItem}-${lastItem} of ${props.totalItems} ${props.entityName}`;
});

/**
 * Check if on first page
 */
const isFirstPage = computed(() => props.currentPage === 1);

/**
 * Check if on last page
 */
const isLastPage = computed(() => props.currentPage === props.totalPages);

/**
 * Emit page change (convert to 0-indexed)
 */
function goToPage(page: number): void {
  emit('page-change', page - 1);
}

/**
 * Go to previous page
 */
function prevPage(): void {
  emit('prev');
}

/**
 * Go to next page
 */
function nextPage(): void {
  emit('next');
}

/**
 * Get button classes
 */
function getButtonClasses(isActive = false): string {
  const classes = [
    'w-8',
    'h-8',
    'flex',
    'items-center',
    'justify-center',
    'bg-[var(--bg-elevated)]',
    'border',
    'border-[var(--border)]',
    'rounded-[var(--radius)]',
    'text-[var(--text-secondary)]',
    'cursor-pointer',
    'transition-[var(--transition)]',
    'text-[0.85rem]',
    'font-medium',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
  ];

  if (isActive) {
    classes.push('bg-[var(--cyan)]', 'border-[var(--cyan)]', 'text-[var(--bg-dark)]');
  } else {
    classes.push(
      'hover:border-[var(--cyan)]',
      'hover:text-[var(--cyan)]',
      'hover:disabled:border-[var(--border)]',
      'hover:disabled:text-[var(--text-secondary)]',
    );
  }

  return classes.join(' ');
}
</script>

<template>
  <div
    class="flex items-center justify-between p-5 bg-[var(--bg-panel)] border-t border-[var(--border)]"
    data-test="table-pagination"
  >
    <!-- Left: Info text -->
    <div class="text-[0.85rem] text-[var(--text-secondary)]" data-test="pagination-info">
      {{ paginationInfo }}
    </div>

    <!-- Right: Page controls -->
    <div class="flex gap-2" data-test="pagination-controls">
      <!-- Previous button -->
      <button
        :class="getButtonClasses()"
        :disabled="isFirstPage"
        aria-label="Previous page"
        data-test="pagination-prev"
        @click="prevPage"
      >
        ←
      </button>

      <!-- Page number buttons -->
      <button
        v-for="page in visiblePages"
        :key="page"
        :class="getButtonClasses(page === currentPage)"
        :aria-label="`Page ${page}`"
        :aria-current="page === currentPage ? 'page' : undefined"
        :data-test="`pagination-page-${page}`"
        @click="goToPage(page)"
      >
        {{ page }}
      </button>

      <!-- Next button -->
      <button
        :class="getButtonClasses()"
        :disabled="isLastPage"
        aria-label="Next page"
        data-test="pagination-next"
        @click="nextPage"
      >
        →
      </button>
    </div>
  </div>
</template>
