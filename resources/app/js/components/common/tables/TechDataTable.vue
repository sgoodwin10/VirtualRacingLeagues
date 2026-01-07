<script setup lang="ts" generic="T extends Record<string, any>">
import { computed } from 'vue';
import DataTable from 'primevue/datatable';
import Select from 'primevue/select';
import Button from '@app/components/common/buttons/Button.vue';
import {
  PhCaretDoubleLeft,
  PhCaretLeft,
  PhCaretRight,
  PhCaretDoubleRight,
} from '@phosphor-icons/vue';
import type {
  DataTablePageEvent,
  DataTableSortEvent,
  DataTableFilterEvent,
  DataTableRowReorderEvent,
} from 'primevue/datatable';

interface Props {
  /** Table data */
  value: T[];
  /** Show loading spinner */
  loading?: boolean;
  /** Enable pagination */
  paginator?: boolean;
  /** Rows per page */
  rows?: number;
  /** Rows per page options */
  rowsPerPageOptions?: number[];
  /** Total records (for lazy loading) */
  totalRecords?: number;
  /** First row index (for pagination control) */
  first?: number;
  /** Enable lazy loading */
  lazy?: boolean;
  /** Paginator template */
  paginatorTemplate?: string;
  /** Current page report template */
  currentPageReportTemplate?: string;
  /** Enable row hover */
  rowHover?: boolean;
  /** Empty message */
  emptyMessage?: string;
  /** Enable responsive layout */
  responsiveLayout?: 'scroll' | 'stack';
  /** DataTable class for custom styling */
  tableClass?: string;
  /** Apply podium highlighting to rows (requires position field) */
  podiumHighlight?: boolean;
  /** Position field name for podium highlighting */
  positionField?: keyof T;
  /** Enable reorderable rows */
  reorderableRows?: boolean;
  /** Entity name for pagination (e.g., 'drivers', 'records') */
  entityName?: string;
  /** Use custom paginator template */
  useCustomPaginator?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  paginator: false,
  rows: 10,
  rowsPerPageOptions: undefined,
  totalRecords: undefined,
  first: 0,
  lazy: false,
  paginatorTemplate:
    'FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown',
  currentPageReportTemplate: 'Showing {first} to {last} of {totalRecords} entries',
  rowHover: true,
  emptyMessage: 'No data available',
  responsiveLayout: 'scroll',
  tableClass: '',
  podiumHighlight: false,
  positionField: 'position' as keyof T,
  reorderableRows: false,
  entityName: 'records',
  useCustomPaginator: true,
});

interface Emits {
  page: [event: DataTablePageEvent];
  sort: [event: DataTableSortEvent];
  filter: [event: DataTableFilterEvent];
  rowReorder: [event: DataTableRowReorderEvent];
}

const emit = defineEmits<Emits>();

/**
 * Get podium class for row based on position
 */
const getRowClass = (data: T): string => {
  if (!props.podiumHighlight || !props.positionField) return '';

  const position = data[props.positionField] as number | undefined;
  if (!position) return '';

  switch (position) {
    case 1:
      return 'podium-1';
    case 2:
      return 'podium-2';
    case 3:
      return 'podium-3';
    default:
      return '';
  }
};

/**
 * Combined table classes
 */
const tableClasses = computed(() => {
  return ['tech-datatable', props.tableClass].filter(Boolean).join(' ');
});

/**
 * Handle page event
 */
function onPage(event: DataTablePageEvent): void {
  emit('page', event);
}

/**
 * Handle sort event
 */
function onSort(event: DataTableSortEvent): void {
  emit('sort', event);
}

/**
 * Handle filter event
 */
function onFilter(event: DataTableFilterEvent): void {
  emit('filter', event);
}

/**
 * Handle row reorder event
 */
function onRowReorder(event: DataTableRowReorderEvent): void {
  emit('rowReorder', event);
}
</script>

<template>
  <DataTable
    :value="value"
    :loading="loading"
    :paginator="paginator"
    :rows="rows"
    :rows-per-page-options="rowsPerPageOptions"
    :total-records="totalRecords"
    :first="first"
    :lazy="lazy"
    :paginator-template="paginatorTemplate"
    :current-page-report-template="currentPageReportTemplate"
    :row-hover="rowHover"
    :responsive-layout="responsiveLayout"
    :reorderable-rows="reorderableRows"
    :row-class="podiumHighlight ? getRowClass : undefined"
    :class="tableClasses"
    @page="onPage"
    @sort="onSort"
    @filter="onFilter"
    @row-reorder="onRowReorder"
  >
    <!-- Pass through all slots -->
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>

    <template #empty>
      <slot name="empty">
        <div class="text-center py-8">
          <i class="pi pi-inbox text-4xl text-gray-400 mb-3 opacity-30"></i>
          <p class="text-muted">{{ emptyMessage }}</p>
        </div>
      </slot>
    </template>

    <template #loading>
      <slot name="loading">
        <div class="text-center py-8">
          <i class="pi pi-spin pi-spinner text-4xl text-gray-400"></i>
          <p class="text-muted mt-3">Loading data...</p>
        </div>
      </slot>
    </template>

    <!-- Default slot for columns -->
    <slot />

    <!-- Custom Paginator Template -->
    <template
      v-if="useCustomPaginator && paginator"
      #paginatorcontainer="{
        first: paginatorFirst,
        last: paginatorLast,
        page,
        pageCount,
        prevPageCallback,
        nextPageCallback,
        totalRecords: total,
      }"
    >
      <div class="flex items-center justify-between w-full px-4 py-2">
        <!-- Left: Record info -->
        <span class="text-sm text-gray-600">
          Showing {{ paginatorFirst }} to {{ paginatorLast }} of {{ total ?? 0 }} {{ entityName }}
        </span>

        <!-- Center: Rows per page -->
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">Rows per page:</span>
          <Select
            :model-value="rows"
            :options="rowsPerPageOptions"
            class="w-20"
            @change="
              (e) =>
                onPage({
                  page: 0,
                  rows: e.value,
                  first: 0,
                  pageCount: Math.ceil((total ?? 0) / e.value),
                } as DataTablePageEvent)
            "
          />
        </div>

        <!-- Right: Navigation -->
        <div class="flex items-center gap-1">
          <Button
            :icon="PhCaretDoubleLeft"
            variant="outline"
            size="sm"
            :disabled="(page ?? 0) === 0"
            aria-label="First page"
            @click="
              onPage({
                page: 0,
                rows: rows,
                first: 0,
                pageCount: pageCount ?? 0,
              } as DataTablePageEvent)
            "
          />
          <Button
            :icon="PhCaretLeft"
            variant="outline"
            size="sm"
            :disabled="(page ?? 0) === 0"
            aria-label="Previous page"
            @click="prevPageCallback"
          />
          <span class="text-sm text-gray-600 mx-2">
            Page {{ (page ?? 0) + 1 }} of {{ pageCount ?? 0 }}
          </span>
          <Button
            :icon="PhCaretRight"
            variant="outline"
            size="sm"
            :disabled="(page ?? 0) === (pageCount ?? 1) - 1"
            aria-label="Next page"
            @click="nextPageCallback"
          />
          <Button
            :icon="PhCaretDoubleRight"
            variant="outline"
            size="sm"
            :disabled="(page ?? 0) === (pageCount ?? 1) - 1"
            aria-label="Last page"
            @click="
              onPage({
                page: (pageCount ?? 1) - 1,
                rows: rows,
                first: ((pageCount ?? 1) - 1) * rows,
                pageCount: pageCount ?? 0,
              } as DataTablePageEvent)
            "
          />
        </div>
      </div>
    </template>

    <!-- Allow custom paginator override if slot is provided -->
    <template v-else-if="$slots.paginatorcontainer" #paginatorcontainer="slotProps">
      <slot name="paginatorcontainer" v-bind="slotProps" />
    </template>
  </DataTable>
</template>

<style scoped>
/* Component-specific overrides if needed */
.tech-datatable {
  /* Ensure no striped rows */
  --p-datatable-row-background: transparent;
}
</style>
