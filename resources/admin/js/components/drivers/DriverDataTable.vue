<template>
  <DataTable
    :value="drivers"
    :loading="loading"
    :rows="rows"
    :first="first"
    :total-records="totalRecords"
    :paginator="true"
    :rows-per-page-options="[15, 25, 50]"
    paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
    current-page-report-template="Showing {first} to {last} of {totalRecords} drivers"
    lazy
    striped-rows
    responsive-layout="scroll"
    class="drivers-table"
    @page="onPage"
  >
    <!-- Empty state -->
    <template #empty>
      <EmptyState message="No drivers found" />
    </template>

    <!-- Loading state -->
    <template #loading>
      <LoadingState message="Loading drivers..." />
    </template>

    <!-- ID Column -->
    <Column field="id" header="ID" :sortable="true" style="min-width: 80px">
      <template #body="{ data }">
        <span class="text-gray-700">{{ data.id }}</span>
      </template>
    </Column>

    <!-- Avatar & Name Column -->
    <Column field="display_name" header="Driver" :sortable="true" style="min-width: 220px">
      <template #body="{ data }">
        <div class="flex items-center">
          <div>
            <p class="text-sm font-medium text-gray-900">{{ data.display_name }}</p>
            <p v-if="data.nickname" class="text-xs text-gray-500">{{ data.nickname }}</p>
          </div>
        </div>
      </template>
    </Column>

    <!-- Email Column -->
    <Column field="email" header="Email" :sortable="true" style="min-width: 200px">
      <template #body="{ data }">
        <span v-if="data.email" class="text-sm text-gray-700">{{ data.email }}</span>
        <span v-else class="text-gray-400">-</span>
      </template>
    </Column>

    <!-- Platform IDs Column -->
    <Column header="Platform IDs" style="min-width: 250px">
      <template #body="{ data }">
        <div class="space-y-1">
          <div v-if="data.psn_id" class="flex items-center gap-2">
            <Badge text="PSN" variant="info" size="sm" />
            <span class="text-xs text-gray-700">{{ data.psn_id }}</span>
          </div>
          <div v-if="data.iracing_id" class="flex items-center gap-2">
            <Badge text="iRacing" variant="success" size="sm" />
            <span class="text-xs text-gray-700">{{ data.iracing_id }}</span>
          </div>
          <div v-if="data.discord_id" class="flex items-center gap-2">
            <Badge text="Discord" variant="secondary" size="sm" />
            <span class="text-xs text-gray-700">{{ data.discord_id }}</span>
          </div>
          <span v-if="!data.psn_id && !data.iracing_id && !data.discord_id" class="text-gray-400">
            No platform IDs
          </span>
        </div>
      </template>
    </Column>

    <!-- Status Column -->
    <Column field="deleted_at" header="Status" :sortable="true" style="min-width: 100px">
      <template #body="{ data }">
        <Badge
          :text="getStatusLabel(data)"
          :variant="getStatusVariant(data)"
          :icon="getStatusIcon(data)"
        />
      </template>
    </Column>

    <!-- Created Date Column -->
    <Column field="created_at" header="Created" :sortable="true" style="min-width: 150px">
      <template #body="{ data }">
        <span class="text-sm text-gray-700">{{ formatDate(data.created_at) }}</span>
      </template>
    </Column>

    <!-- Actions Column -->
    <Column header="Actions" :exportable="false" style="min-width: 180px">
      <template #body="{ data }">
        <div class="flex gap-2">
          <Button
            v-tooltip.top="'View Details'"
            icon="pi pi-eye"
            text
            rounded
            severity="secondary"
            size="small"
            @click="handleView(data)"
          />
          <Button
            v-tooltip.top="'Edit'"
            icon="pi pi-pencil"
            text
            rounded
            severity="info"
            size="small"
            @click="handleEdit(data)"
          />
          <Button
            v-if="!data.deleted_at"
            v-tooltip.top="'Delete'"
            icon="pi pi-trash"
            text
            rounded
            severity="danger"
            size="small"
            @click="handleDelete(data)"
          />
        </div>
      </template>
    </Column>
  </DataTable>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Badge from '@admin/components/common/Badge.vue';
import EmptyState from '@admin/components/common/EmptyState.vue';
import LoadingState from '@admin/components/common/LoadingState.vue';
import { useDateFormatter } from '@admin/composables/useDateFormatter';
import type { Driver } from '@admin/types/driver';

/**
 * Props interface for DriverDataTable component
 */
export interface DriverDataTableProps {
  /**
   * Array of drivers to display
   */
  drivers?: Driver[];

  /**
   * Whether the table is loading
   */
  loading?: boolean;

  /**
   * Total number of records (for server-side pagination)
   */
  totalRecords?: number;

  /**
   * Current page number (1-based)
   */
  currentPage?: number;

  /**
   * Number of rows per page
   */
  rows?: number;
}

/**
 * Page event payload from PrimeVue DataTable
 */
export interface PageEvent {
  page: number;
  first: number;
  rows: number;
  pageCount: number;
}

/**
 * Emits interface for DriverDataTable component
 */
export interface DriverDataTableEmits {
  /**
   * Emitted when user clicks view
   */
  (event: 'view', driver: Driver): void;

  /**
   * Emitted when user clicks edit
   */
  (event: 'edit', driver: Driver): void;

  /**
   * Emitted when user clicks delete
   */
  (event: 'delete', driver: Driver): void;

  /**
   * Emitted when pagination changes
   */
  (event: 'page', payload: PageEvent): void;
}

// Props
const props = withDefaults(defineProps<DriverDataTableProps>(), {
  drivers: () => [],
  loading: false,
  totalRecords: 0,
  currentPage: 1,
  rows: 15,
});

// Emits
const emit = defineEmits<DriverDataTableEmits>();

// Composables
const { formatDate } = useDateFormatter();

/**
 * Computed first index for DataTable (0-based)
 * Converts from 1-based page number to 0-based first record index
 */
const first = computed(() => (props.currentPage - 1) * props.rows);

/**
 * Handle page change event from DataTable
 */
const onPage = (event: PageEvent): void => {
  emit('page', event);
};

/**
 * Get status label based on deleted_at
 */
const getStatusLabel = (driver: Driver): string => {
  return driver.deleted_at ? 'Deleted' : 'Active';
};

/**
 * Get status badge variant
 */
const getStatusVariant = (driver: Driver): 'success' | 'danger' => {
  return driver.deleted_at ? 'danger' : 'success';
};

/**
 * Get status icon
 */
const getStatusIcon = (driver: Driver): string => {
  return driver.deleted_at ? 'pi pi-times-circle' : 'pi pi-check-circle';
};

/**
 * Handle view click
 */
const handleView = (driver: Driver): void => {
  emit('view', driver);
};

/**
 * Handle edit click
 */
const handleEdit = (driver: Driver): void => {
  emit('edit', driver);
};

/**
 * Handle delete click
 */
const handleDelete = (driver: Driver): void => {
  emit('delete', driver);
};
</script>

<style scoped></style>
