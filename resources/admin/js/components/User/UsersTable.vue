<template>
  <DataTable
    :value="users"
    :loading="loading"
    :rows="15"
    :paginator="true"
    :rows-per-page-options="[15, 25, 50]"
    paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
    current-page-report-template="Showing {first} to {last} of {totalRecords} users"
    striped-rows
    responsive-layout="scroll"
    class="users-table"
  >
    <!-- Empty state -->
    <template #empty>
      <EmptyState message="No users found" />
    </template>

    <!-- Loading state -->
    <template #loading>
      <LoadingState message="Loading users..." />
    </template>

    <!-- ID Column -->
    <Column field="id" header="ID" :sortable="true" style="min-width: 80px">
      <template #body="{ data }">
        <span class="text-gray-700">{{ data.id }}</span>
      </template>
    </Column>

    <!-- Name Column -->
    <Column field="name" header="Name" :sortable="true" style="min-width: 200px">
      <template #body="{ data }">
        <div>
          <p class="font-medium text-gray-900">{{ getFullName(data) }}</p>
          <p v-if="data.deleted_at" class="text-xs text-red-500">(Deactivated)</p>
        </div>
      </template>
    </Column>

    <!-- Email Column -->
    <Column field="email" header="Email" :sortable="true" style="min-width: 250px">
      <template #body="{ data }">
        <span class="text-gray-700">{{ data.email }}</span>
      </template>
    </Column>

    <!-- Alias Column -->
    <Column field="alias" header="Alias" :sortable="true" style="min-width: 150px">
      <template #body="{ data }">
        <span v-if="data.alias" class="text-gray-700">{{ data.alias }}</span>
        <span v-else class="text-gray-400">-</span>
      </template>
    </Column>

    <!-- Status Column -->
    <Column field="status" header="Status" :sortable="true" style="min-width: 100px">
      <template #body="{ data }">
        <Badge
          :text="getStatusLabel(data.status)"
          :variant="getStatusVariant(data.status)"
          :icon="getStatusIcon(data.status)"
        />
      </template>
    </Column>

    <!-- Created At Column -->
    <Column field="created_at" header="Created" :sortable="true" style="min-width: 170px">
      <template #body="{ data }">
        <span class="text-gray-700">
          {{ formatDate(data.created_at) }}
        </span>
      </template>
    </Column>

    <!-- Actions Column -->
    <Column header="Actions" :exportable="false" style="min-width: 200px">
      <template #body="{ data }">
        <div class="flex gap-2">
          <Button
            v-tooltip.top="'View'"
            icon="pi pi-eye"
            text
            rounded
            severity="secondary"
            size="small"
            aria-label="View user details"
            @click="handleView(data)"
          />
          <Button
            v-if="!data.deleted_at"
            v-tooltip.top="'Login As User'"
            icon="pi pi-sign-in"
            text
            rounded
            severity="warning"
            size="small"
            aria-label="Login as this user"
            :loading="loggingInAsUser.get(data.id) || false"
            @click="handleLoginAsUser(data)"
          />
          <Button
            v-tooltip.top="'Edit'"
            icon="pi pi-pencil"
            text
            rounded
            severity="info"
            size="small"
            aria-label="Edit user"
            @click="handleEdit(data)"
          />
          <Button
            v-if="!data.deleted_at"
            v-tooltip.top="'Deactivate'"
            icon="pi pi-trash"
            text
            rounded
            severity="danger"
            size="small"
            aria-label="Deactivate user"
            @click="handleDeactivate(data)"
          />
          <Button
            v-else
            v-tooltip.top="'Reactivate'"
            icon="pi pi-refresh"
            text
            rounded
            severity="success"
            size="small"
            aria-label="Reactivate user"
            @click="handleReactivate(data)"
          />
        </div>
      </template>
    </Column>
  </DataTable>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';
import Badge from '@admin/components/common/Badge.vue';
import EmptyState from '@admin/components/common/EmptyState.vue';
import LoadingState from '@admin/components/common/LoadingState.vue';
import { useDateFormatter } from '@admin/composables/useDateFormatter';
import { useStatusHelpers } from '@admin/composables/useStatusHelpers';
import { useNameHelpers } from '@admin/composables/useNameHelpers';
import userService from '@admin/services/userService';
import { logger } from '@admin/utils/logger';
import { buildLoginAsUrl } from '@admin/utils/url';
import type { User } from '@admin/types/user';

/**
 * Props interface for UsersTable component
 */
export interface UsersTableProps {
  /**
   * Array of users to display
   */
  users?: User[];

  /**
   * Whether the table is loading
   */
  loading?: boolean;
}

/**
 * Emits interface for UsersTable component
 */
export interface UsersTableEmits {
  /**
   * Emitted when user clicks view
   */
  (event: 'view', user: User): void;

  /**
   * Emitted when user clicks edit
   */
  (event: 'edit', user: User): void;

  /**
   * Emitted when user clicks deactivate
   */
  (event: 'deactivate', user: User): void;

  /**
   * Emitted when user clicks reactivate
   */
  (event: 'reactivate', user: User): void;
}

// Props
withDefaults(defineProps<UsersTableProps>(), {
  users: () => [],
  loading: false,
});

// Emits
const emit = defineEmits<UsersTableEmits>();

// Composables
const toast = useToast();
const { formatDate } = useDateFormatter();
const { getStatusLabel, getStatusVariant, getStatusIcon } = useStatusHelpers();
const { getFullName } = useNameHelpers();

// State
const loggingInAsUser = ref<Map<string, boolean>>(new Map());

// Cleanup on unmount
onBeforeUnmount(() => {
  // Clear all loading states
  loggingInAsUser.value.clear();
});

/**
 * Handle view click
 */
const handleView = (user: User): void => {
  emit('view', user);
};

/**
 * Handle edit click
 */
const handleEdit = (user: User): void => {
  emit('edit', user);
};

/**
 * Handle deactivate click
 */
const handleDeactivate = (user: User): void => {
  emit('deactivate', user);
};

/**
 * Handle reactivate click
 */
const handleReactivate = (user: User): void => {
  emit('reactivate', user);
};

/**
 * Handle login as user click
 */
const handleLoginAsUser = async (user: User): Promise<void> => {
  loggingInAsUser.value.set(user.id, true);
  try {
    const { token } = await userService.loginAsUser(user.id);

    // Build login URL with proper port handling
    const loginUrl = buildLoginAsUrl(token);

    // Open in new tab
    window.open(loginUrl, '_blank');

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Opening user dashboard for ${getFullName(user)}`,
      life: 3000,
    });
  } catch (error) {
    logger.error('Failed to login as user', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to login as user',
      life: 5000,
    });
  } finally {
    loggingInAsUser.value.set(user.id, false);
  }
};
</script>

<style scoped></style>
