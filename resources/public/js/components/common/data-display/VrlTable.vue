<script setup lang="ts">
/**
 * VrlTable - Data table component wrapping PrimeVue DataTable with racing theme
 *
 * @component
 * @example
 * ```vue
 * <VrlTable
 *   :data="drivers"
 *   :columns="[
 *     { field: 'name', header: 'Driver', sortable: true },
 *     { field: 'team', header: 'Team', sortable: true },
 *     { field: 'points', header: 'Points', align: 'right', sortable: true }
 *   ]"
 *   :sticky-header="true"
 *   :loading="isLoading"
 * >
 *   <!-- Custom column rendering via slot -->
 *   <template #body-name="{ data }">
 *     <strong>{{ data.name }}</strong>
 *   </template>
 * </VrlTable>
 * ```
 */
import { computed } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

/**
 * Table column configuration
 */
export interface TableColumn {
  /** Field name in data object */
  field: string;
  /** Column header text */
  header: string;
  /** Enable column sorting */
  sortable?: boolean;
  /** Column width (CSS value) */
  width?: string;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
}

/**
 * Component props interface
 */
interface Props {
  /**
   * Array of data objects to display
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Array<Record<string, any>>;

  /**
   * Column configuration array
   */
  columns: Array<TableColumn>;

  /**
   * Show loading state
   * @default false
   */
  loading?: boolean;

  /**
   * Enable sticky header on scroll
   * @default false
   */
  stickyHeader?: boolean;

  /**
   * Additional CSS classes
   * @default ''
   */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  stickyHeader: false,
  class: '',
});

// Build table classes
const tableClasses = computed(() => {
  const classes = ['vrl-table'];
  if (props.stickyHeader) {
    classes.push('sticky-header');
  }
  if (props.class) {
    classes.push(props.class);
  }
  return classes.join(' ');
});

// Get column alignment class
const getAlignmentClass = (align?: 'left' | 'center' | 'right'): string => {
  switch (align) {
    case 'center':
      return 'text-center';
    case 'right':
      return 'text-right';
    default:
      return 'text-left';
  }
};
</script>

<template>
  <div :class="tableClasses">
    <DataTable
      :value="data"
      :loading="loading"
      responsive-layout="scroll"
      :pt="{
        wrapper: 'overflow-auto rounded',
        table: 'w-full border-collapse min-w-[600px]',
        header: 'vrl-table-header',
        body: 'vrl-table-body',
        loadingOverlay: 'vrl-table-loading',
      }"
    >
      <Column
        v-for="col in columns"
        :key="col.field"
        :field="col.field"
        :header="col.header"
        :sortable="col.sortable"
        :style="{ width: col.width }"
        :pt="{
          headerCell: `vrl-table-header-cell ${getAlignmentClass(col.align)}`,
          bodyCell: `vrl-table-body-cell ${getAlignmentClass(col.align)}`,
        }"
      >
        <!-- Dynamic column slot for custom cell rendering -->
        <template #body="slotProps">
          <slot :name="`cell-${col.field}`" :data="slotProps.data" :field="col.field">
            {{ slotProps.data[col.field] }}
          </slot>
        </template>
      </Column>

      <!-- Empty state slot -->
      <template #empty>
        <slot name="empty">
          <div class="text-center py-8 theme-text-muted">No data available</div>
        </slot>
      </template>

      <!-- Loading state slot -->
      <template #loading>
        <slot name="loading">
          <div class="text-center py-8 theme-text-muted">Loading data...</div>
        </slot>
      </template>
    </DataTable>
  </div>
</template>

<style scoped>
/* Table wrapper */
.vrl-table {
  border: 1px solid var(--border-primary);
  border-radius: 0.25rem;
  overflow: hidden;
  background-color: var(--bg-secondary);
}

/* Sticky header */
.vrl-table.sticky-header :deep(.p-datatable-thead) {
  position: sticky;
  top: 0;
  z-index: 10;
}

/* Header styling */
.vrl-table :deep(.vrl-table-header-cell) {
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-primary);
  padding: 0.75rem 1rem;
  font-family: var(--font-display);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--text-dim);
}

/* Body cell styling */
.vrl-table :deep(.vrl-table-body-cell) {
  border-bottom: 1px solid var(--border-subtle);
  padding: 0.75rem 1rem;
  font-family: var(--font-data);
  font-size: 0.875rem;
  color: var(--text-primary);
}

/* Row default background - ensure dark mode compatibility */
.vrl-table :deep(.p-datatable-tbody > tr) {
  background-color: var(--bg-secondary);
  transition: background-color var(--duration-fast);
}

/* Override PrimeVue's striped row backgrounds if present */
.vrl-table :deep(.p-datatable-tbody > tr.p-row-odd) {
  background-color: var(--bg-secondary);
}

/* Row hover effect */
.vrl-table :deep(.p-datatable-tbody > tr:hover) {
  background-color: var(--bg-hover);
}

/* Remove border from last row */
.vrl-table :deep(.p-datatable-tbody > tr:last-child td) {
  border-bottom: 0;
}

/* Loading overlay */
.vrl-table :deep(.vrl-table-loading) {
  background: var(--bg-glass);
  backdrop-filter: blur(4px);
}

/* Sort icon styling */
.vrl-table :deep(.p-sortable-column-icon) {
  color: var(--text-dim);
  margin-left: 0.5rem;
}

.vrl-table :deep(.p-highlight .p-sortable-column-icon) {
  color: var(--accent-gold);
}
</style>
