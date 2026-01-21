<script setup lang="ts" generic="T extends Record<string, any>">
import { computed } from 'vue';
import DataTable from 'primevue/datatable';
import type {
  DataTablePageEvent,
  DataTableSortEvent,
  DataTableFilterEvent,
} from 'primevue/datatable';
import VrlTablePagination from './VrlTablePagination.vue';

/**
 * VrlDataTable - Main data table component for VRL Velocity design system
 *
 * Wraps PrimeVue DataTable with VRL-specific styling, podium highlighting,
 * and custom pagination component.
 *
 * @example
 * ```vue
 * <VrlDataTable
 *   :value="standings"
 *   :podium-highlight="true"
 *   position-field="position"
 *   :paginated="true"
 *   :rows="10"
 *   entity-name="drivers"
 * >
 *   <Column field="position" header="Pos">
 *     <template #body="{ data }">
 *       <VrlPositionCell :position="data.position" />
 *     </template>
 *   </Column>
 * </VrlDataTable>
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface VrlDataTableProps<T extends Record<string, any>> {
  /** Table data array */
  value: T[];

  /** Show loading spinner */
  loading?: boolean;

  /** Empty state message */
  emptyMessage?: string;

  /** Enable pagination */
  paginated?: boolean;

  /** Rows per page */
  rows?: number;

  /** Rows per page options for dropdown */
  rowsPerPageOptions?: number[];

  /** Total records (for lazy loading) */
  totalRecords?: number;

  /** First row index (for pagination control) */
  first?: number;

  /** Enable lazy loading */
  lazy?: boolean;

  /** Enable sortable columns */
  sortable?: boolean;

  /** Enable row hover effect */
  hoverable?: boolean;

  /** Enable striped rows */
  striped?: boolean;

  /** Apply podium highlighting to rows (requires position field) */
  podiumHighlight?: boolean;

  /** Position field name for podium highlighting */
  positionField?: keyof T;

  /** Additional CSS class for table */
  tableClass?: string;

  /** Responsive layout mode */
  responsiveLayout?: 'scroll' | 'stack';

  /** Use custom VRL pagination component */
  useCustomPagination?: boolean;

  /** Entity name for pagination text (e.g., 'drivers', 'teams') */
  entityName?: string;
}

const props = withDefaults(defineProps<VrlDataTableProps<T>>(), {
  loading: false,
  emptyMessage: 'No data available',
  paginated: false,
  rows: 10,
  rowsPerPageOptions: () => [5, 10, 25, 50],
  totalRecords: undefined,
  first: 0,
  lazy: false,
  sortable: true,
  hoverable: true,
  striped: false,
  podiumHighlight: false,
  positionField: 'position' as keyof T,
  tableClass: '',
  responsiveLayout: 'scroll',
  useCustomPagination: true,
  entityName: 'records',
});

interface VrlDataTableEmits {
  (e: 'page', event: DataTablePageEvent): void;
  (e: 'sort', event: DataTableSortEvent): void;
  (e: 'filter', event: DataTableFilterEvent): void;
}

const emit = defineEmits<VrlDataTableEmits>();

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
  const classes = [
    'w-full',
    'border-collapse',
    'bg-[var(--bg-card)]',
    'border',
    'border-[var(--border)]',
    'rounded-[var(--radius-lg)]',
    'overflow-hidden',
    '[&_th]:font-[family-name:var(--font-display)]',
    '[&_th]:text-[0.7rem]',
    '[&_th]:font-semibold',
    '[&_th]:tracking-[1px]',
    '[&_th]:uppercase',
    '[&_th]:text-[var(--text-muted)]',
    '[&_th]:text-left',
    '[&_th]:p-5',
    '[&_th]:bg-[var(--bg-panel)]',
    '[&_th]:border-b',
    '[&_th]:border-[var(--border)]',
    '[&_td]:p-5',
    '[&_td]:border-b',
    '[&_td]:border-[var(--border-muted)]',
    '[&_td]:text-[0.9rem]',
    '[&_td]:text-[var(--text-primary)]',
    '[&_tr:last-child_td]:border-b-0',
  ];

  if (props.tableClass) {
    classes.push(props.tableClass);
  }

  if (props.hoverable) {
    classes.push('[&_tbody_tr_td]:bg-transparent');
    classes.push('[&_tbody_tr_td]:transition-colors');
    classes.push('[&_tbody_tr_td]:duration-150');
    classes.push('[&_tbody_tr:hover_td]:bg-[var(--bg-elevated)]');
  }

  if (props.striped) {
    classes.push('[&_tbody_tr:nth-child(even)_td]:bg-[rgba(255,255,255,0.02)]');
  }

  return classes.join(' ');
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
 * Handle page change from custom pagination
 */
function handlePageChange(page: number): void {
  const pageCount = Math.ceil((props.totalRecords ?? props.value.length) / props.rows);
  const event = {
    page,
    rows: props.rows,
    first: page * props.rows,
    pageCount,
    sortField: undefined,
    sortOrder: undefined,
    multiSortMeta: undefined,
    filters: {},
    filterMatchModes: undefined,
    originalEvent: new Event('page'),
  } as DataTablePageEvent;
  onPage(event);
}

/**
 * Wrapper for prev page callback
 */
function handlePrevPage(callback: (event: Event) => void): void {
  callback(new Event('prev'));
}

/**
 * Wrapper for next page callback
 */
function handleNextPage(callback: (event: Event) => void): void {
  callback(new Event('next'));
}
</script>

<template>
  <DataTable
    :value="value"
    :loading="loading"
    :paginator="paginated"
    :rows="rows"
    :rows-per-page-options="rowsPerPageOptions"
    :total-records="totalRecords"
    :first="first"
    :lazy="lazy"
    :row-hover="false"
    :responsive-layout="responsiveLayout"
    :row-class="podiumHighlight ? getRowClass : undefined"
    :striped-rows="striped"
    :class="tableClasses"
    @page="onPage"
    @sort="onSort"
    @filter="onFilter"
  >
    <!-- Header slot -->
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>

    <!-- Empty state -->
    <template #empty>
      <slot name="empty">
        <div class="text-center py-8" data-test="datatable-empty">
          <p class="text-[var(--text-muted)]">{{ emptyMessage }}</p>
        </div>
      </slot>
    </template>

    <!-- Loading state -->
    <template #loading>
      <slot name="loading">
        <div class="text-center py-8" data-test="datatable-loading">
          <i class="pi pi-spin pi-spinner"></i>
          <p class="text-[var(--text-muted)] mt-2">Loading data...</p>
        </div>
      </slot>
    </template>

    <!-- Default slot for columns -->
    <slot />

    <!-- Custom Paginator -->
    <template
      v-if="useCustomPagination && paginated"
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
      <VrlTablePagination
        :current-page="(page ?? 0) + 1"
        :total-pages="pageCount ?? 1"
        :total-items="total ?? 0"
        :items-per-page="rows"
        :first="paginatorFirst ?? 0"
        :last="paginatorLast ?? 0"
        :entity-name="entityName"
        @page-change="handlePageChange"
        @prev="() => handlePrevPage(prevPageCallback)"
        @next="() => handleNextPage(nextPageCallback)"
      />
    </template>

    <!-- Allow custom paginator override if slot is provided -->
    <template v-else-if="$slots.paginatorcontainer" #paginatorcontainer="slotProps">
      <slot name="paginatorcontainer" v-bind="slotProps" />
    </template>
  </DataTable>
</template>

<style scoped>
/* Override PrimeVue DataTable default backgrounds */
:deep(.p-datatable) {
  --p-datatable-row-background: transparent;
  --p-datatable-body-row-background: transparent;
}

:deep(.p-datatable-tbody > tr) {
  background: transparent !important;
  transition: background-color 0.15s ease;
}

:deep(.p-datatable-tbody > tr > td) {
  background: transparent;
}

/* Row hover effect */
:deep(.p-datatable-tbody > tr:hover) {
  background-color: var(--bg-elevated) !important;
}

/* Podium row background colors */
:deep(.p-datatable-tbody > tr.podium-1) {
  background-color: rgba(210, 153, 34, 0.08) !important;
}

:deep(.p-datatable-tbody > tr.podium-2) {
  background-color: rgba(110, 118, 129, 0.08) !important;
}

:deep(.p-datatable-tbody > tr.podium-3) {
  background-color: rgba(240, 136, 62, 0.08) !important;
}

/* Podium rows hover - slightly brighter */
:deep(.p-datatable-tbody > tr.podium-1:hover) {
  background-color: rgba(210, 153, 34, 0.15) !important;
}

:deep(.p-datatable-tbody > tr.podium-2:hover) {
  background-color: rgba(110, 118, 129, 0.15) !important;
}

:deep(.p-datatable-tbody > tr.podium-3:hover) {
  background-color: rgba(240, 136, 62, 0.15) !important;
}
</style>
