<script setup lang="ts" generic="T extends Record<string, any>">
import { computed } from 'vue';
import DataTable from 'primevue/datatable';
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
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  paginator: false,
  rows: 10,
  rowsPerPageOptions: undefined,
  totalRecords: undefined,
  first: 0,
  lazy: false,
  rowHover: true,
  emptyMessage: 'No data available',
  responsiveLayout: 'scroll',
  tableClass: '',
  podiumHighlight: false,
  positionField: 'position' as keyof T,
  reorderableRows: false,
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

    <!-- Paginator template -->
    <template v-if="paginator" #paginatorcontainer="slotProps">
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
