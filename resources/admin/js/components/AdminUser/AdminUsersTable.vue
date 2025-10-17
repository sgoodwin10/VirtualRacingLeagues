<template>
  <DataTable
    :value="adminUsers"
    :loading="loading"
    :rows="rowsPerPage"
    :paginator="true"
    :rows-per-page-options="[10, 15, 25, 50]"
    :total-records="totalRecords"
    :lazy="true"
    paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
    current-page-report-template="Showing {first} to {last} of {totalRecords} admin users"
    sort-field="id"
    :sort-order="1"
    striped-rows
    responsive-layout="scroll"
    class="admin-users-table"
    @page="handlePage"
  >
    <!-- Empty state -->
    <template #empty>
      <EmptyState message="No admin users found" />
    </template>

    <!-- Loading state -->
    <template #loading>
      <LoadingState message="Loading admin users..." />
    </template>

    <!-- ID Column -->
    <Column field="id" header="ID" :sortable="true" style="min-width: 80px">
      <template #body="{ data }">
        <span>{{ data.id }}</span>
      </template>
    </Column>

    <!-- First Name Column -->
    <Column field="first_name" header="First Name" :sortable="true" style="min-width: 150px">
      <template #body="{ data }">
        <div>
          <span>{{ getFirstName(data) }}</span>
          <span v-if="data.status === 'inactive'" class="text-xs text-red-500 ml-2"
            >(Deactivated)</span
          >
        </div>
      </template>
    </Column>

    <!-- Last Name Column -->
    <Column field="last_name" header="Last Name" :sortable="true" style="min-width: 150px">
      <template #body="{ data }">
        <span>{{ getLastName(data) }}</span>
      </template>
    </Column>

    <!-- Email Column -->
    <Column field="email" header="Email" style="min-width: 250px">
      <template #body="{ data }">
        <span class="">{{ data.email }}</span>
      </template>
    </Column>

    <!-- Role Column -->
    <Column field="role" header="Role" style="min-width: 130px">
      <template #body="{ data }">
        <Badge
          :text="getRoleLabel(data.role)"
          :variant="getRoleBadgeVariant(data.role)"
          size="sm"
        />
      </template>
    </Column>

    <!-- Status Column -->
    <Column field="status" header="Status" :sortable="true" style="min-width: 120px">
      <template #body="{ data }">
        <Badge
          :text="getStatusLabel(data.status)"
          :variant="getStatusVariant(data.status)"
          :icon="getStatusIcon(data.status)"
        />
      </template>
    </Column>

    <!-- Last Login Column -->
    <Column field="last_login_at" header="Last Login" :sortable="true" style="min-width: 180px">
      <template #body="{ data }">
        <span>
          {{ formatDate(data.last_login_at) }}
        </span>
      </template>
    </Column>

    <!-- Actions Column -->
    <Column header="Actions" :exportable="false" style="min-width: 140px">
      <template #body="{ data }">
        <div class="flex gap-2">
          <Button
            v-tooltip.top="'View'"
            icon="pi pi-eye"
            text
            rounded
            severity="info"
            size="small"
            @click="handleView(data)"
          />
          <Button
            v-if="canEditUser(data)"
            v-tooltip.top="'Edit'"
            icon="pi pi-pencil"
            text
            rounded
            severity="secondary"
            size="small"
            @click="handleEdit(data)"
          />
          <Button
            v-if="canDeleteUser(data) && data.status !== 'inactive'"
            v-tooltip.top="'Deactivate'"
            icon="pi pi-trash"
            text
            rounded
            severity="danger"
            size="small"
            @click="handleDeactivate(data)"
          />
          <Button
            v-else-if="canDeleteUser(data) && data.status === 'inactive'"
            v-tooltip.top="'Reactivate'"
            icon="pi pi-refresh"
            text
            rounded
            severity="success"
            size="small"
            @click="handleReactivate(data)"
          />
        </div>
      </template>
    </Column>
  </DataTable>
</template>

<script setup lang="ts">
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Badge from '@admin/components/common/Badge.vue';
import EmptyState from '@admin/components/common/EmptyState.vue';
import LoadingState from '@admin/components/common/LoadingState.vue';
import { useDateFormatter } from '@admin/composables/useDateFormatter';
import { useRoleHelpers } from '@admin/composables/useRoleHelpers';
import { useStatusHelpers } from '@admin/composables/useStatusHelpers';
import { useNameHelpers } from '@admin/composables/useNameHelpers';
import type { Admin } from '@admin/types/admin';
import type { DataTablePageEvent } from '@admin/types/primevue';

/**
 * Props interface for AdminUsersTable component
 */
export interface AdminUsersTableProps {
  /**
   * Array of admin users to display
   */
  adminUsers: Admin[];

  /**
   * Whether the table is loading
   */
  loading?: boolean;

  /**
   * Total number of records (for pagination)
   */
  totalRecords: number;

  /**
   * Number of rows per page
   */
  rowsPerPage: number;

  /**
   * Current user's role level for permission checks
   */
  currentRoleLevel: number;
}

/**
 * Emits interface for AdminUsersTable component
 */
export interface AdminUsersTableEmits {
  /**
   * Emitted when user clicks view
   */
  (event: 'view', user: Admin): void;

  /**
   * Emitted when user clicks edit
   */
  (event: 'edit', user: Admin): void;

  /**
   * Emitted when user clicks deactivate
   */
  (event: 'deactivate', user: Admin): void;

  /**
   * Emitted when user clicks reactivate
   */
  (event: 'reactivate', user: Admin): void;

  /**
   * Emitted when pagination changes
   */
  (event: 'page', pageEvent: DataTablePageEvent): void;
}

// Props
const props = withDefaults(defineProps<AdminUsersTableProps>(), {
  loading: false,
});

// Emits
const emit = defineEmits<AdminUsersTableEmits>();

// Composables
const { formatDate } = useDateFormatter();
const { getRoleLevel, getRoleLabel, getRoleBadgeVariant } = useRoleHelpers();
const { getStatusLabel, getStatusVariant, getStatusIcon } = useStatusHelpers();
const { getFirstName, getLastName } = useNameHelpers();

/**
 * Check if current user can edit a specific user
 */
const canEditUser = (user: Admin): boolean => {
  const userLevel = getRoleLevel(user.role);
  return props.currentRoleLevel >= userLevel;
};

/**
 * Check if current user can delete a specific user
 */
const canDeleteUser = (user: Admin): boolean => {
  const userLevel = getRoleLevel(user.role);
  return props.currentRoleLevel >= userLevel;
};

/**
 * Handle view click
 */
const handleView = (user: Admin): void => {
  emit('view', user);
};

/**
 * Handle edit click
 */
const handleEdit = (user: Admin): void => {
  emit('edit', user);
};

/**
 * Handle deactivate click
 */
const handleDeactivate = (user: Admin): void => {
  emit('deactivate', user);
};

/**
 * Handle reactivate click
 */
const handleReactivate = (user: Admin): void => {
  emit('reactivate', user);
};

/**
 * Handle pagination event
 */
const handlePage = (event: DataTablePageEvent): void => {
  emit('page', event);
};
</script>

<style scoped></style>
