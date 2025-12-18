<template>
  <div class="admin-users-view">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Admin Users</h1>
      <p class="text-gray-600">Manage admin users and their permissions</p>
    </div>

    <!-- Initial Loading Skeleton -->
    <div v-if="initialLoading" class="space-y-6">
      <Card>
        <template #content>
          <Skeleton height="4rem" class="mb-2" />
        </template>
      </Card>
      <Card>
        <template #content>
          <Skeleton height="20rem" />
        </template>
      </Card>
    </div>

    <!-- Main Content (after initial load) -->
    <div v-else>
      <!-- Toolbar -->
      <Card class="mb-6">
        <template #content>
          <div class="flex flex-col lg:flex-row gap-4 justify-between">
            <!-- Search -->
            <div class="flex-1 max-w-md">
              <IconField>
                <InputIcon class="pi pi-search" />
                <InputText
                  v-model="searchQuery"
                  placeholder="Search by ID, name, or email..."
                  class="w-full"
                />
              </IconField>
            </div>

            <!-- Filter and Actions -->
            <div class="flex gap-4">
              <Select
                v-model="statusFilter"
                :options="statusOptions"
                option-label="label"
                option-value="value"
                placeholder="Filter by status"
                class="w-48"
              />
              <Button
                v-if="adminStore.adminRole === 'super_admin' || adminStore.adminRole === 'admin'"
                label="Add Admin User"
                icon="pi pi-plus"
                @click="openCreateDialog"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Admin Users Table -->
      <Card :pt="{ body: { class: 'p-0' }, content: { class: 'p-0' } }">
        <template #content>
          <AdminUsersTable
            :admin-users="adminUsers"
            :loading="loading"
            :total-records="totalRecords"
            :rows-per-page="rowsPerPage"
            :current-role-level="currentRoleLevel"
            @view="openViewDialog"
            @edit="openEditDialog"
            @deactivate="openDeleteDialog"
            @reactivate="handleReactivate"
            @page="onPage"
          />
        </template>
      </Card>
    </div>

    <!-- View Modal -->
    <ViewAdminUserModal
      v-model:visible="viewDialogVisible"
      :admin-user="selectedAdminUser"
      :can-edit="selectedAdminUser ? canEditUser(selectedAdminUser) : false"
      :can-delete="selectedAdminUser ? canDeleteUser(selectedAdminUser) : false"
      :is-own-profile="false"
      @edit="openEditFromView"
      @delete="openDeleteFromView"
    />

    <!-- Edit Modal -->
    <EditAdminUserModal
      v-model:visible="editDialogVisible"
      :admin-user="selectedAdminUser"
      :available-roles="availableRoles"
      :saving="saving"
      :disable-role-edit="disableRoleEditForSelectedUser"
      @save="saveAdminUser"
      @cancel="handleEditCancel"
    />

    <!-- Create Modal -->
    <CreateAdminUserModal
      ref="createModalRef"
      v-model:visible="createDialogVisible"
      :available-roles="availableRoles"
      :saving="creating"
      @save="handleCreate"
      @cancel="handleCreateCancel"
    />

    <!-- Delete Confirmation Modal -->
    <DeleteAdminUserModal
      v-model:visible="deleteDialogVisible"
      :admin-user="selectedAdminUser"
      :deleting="deleting"
      @delete="handleDelete"
      @cancel="handleDeleteCancel"
    />

    <!-- Toast for notifications -->
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Toast from 'primevue/toast';
import Card from 'primevue/card';
import Skeleton from 'primevue/skeleton';
import AdminUsersTable from '@admin/components/AdminUser/AdminUsersTable.vue';
import { logger } from '@admin/utils/logger';
import {
  ViewAdminUserModal,
  EditAdminUserModal,
  CreateAdminUserModal,
  DeleteAdminUserModal,
} from '@admin/components/AdminUser/modals';
import { adminUserService } from '@admin/services/adminUserService';
import type { AdminUserFilterParams } from '@admin/services/adminUserService';
import { useAdminStore } from '@admin/stores/adminStore';
import type { Admin, AdminRole, AdminStatus, AdminUserUpdateData } from '@admin/types/admin';
import type { DataTablePageEvent } from '@admin/types/primevue';
import { useRoleHelpers } from '@admin/composables/useRoleHelpers';
import { useRequestCancellation } from '@admin/composables/useRequestCancellation';
import { useAdminUserModals } from '@admin/composables/useAdminUserModals';
import { useErrorToast } from '@admin/composables/useErrorToast';
import { isRequestCancelled } from '@admin/types/errors';

// Composables
const toast = useToast();
const adminStore = useAdminStore();
const { getRoleLevel, getRoleLabel } = useRoleHelpers();
const { getSignal, cancel: cancelRequests } = useRequestCancellation();
const { showErrorToast } = useErrorToast();

// State
const adminUsers = ref<Admin[]>([]);
const loading = ref(false);
const initialLoading = ref(true);
const searchQuery = ref('');
const statusFilter = ref<AdminStatus | 'all'>('all');

// Pagination state
const currentPage = ref(1);
const rowsPerPage = ref(15);
const totalRecords = ref(0);

// Track if editing own profile
const isEditingOwnProfile = ref(false);

/**
 * Get current user's role level
 */
const currentRoleLevel = computed(() => {
  const role = adminStore.adminRole;
  return role ? getRoleLevel(role) : 0;
});

// Load admin users from API with pagination and filters
const loadAdminUsers = async (): Promise<void> => {
  loading.value = true;
  try {
    // Cancel any pending requests before starting a new one
    cancelRequests('Loading new page');

    // Build filter parameters
    const filters: AdminUserFilterParams = {
      include_deleted: true, // Always include soft-deleted users
    };

    // Add search query if present
    if (searchQuery.value.trim()) {
      filters.search = searchQuery.value.trim();
    }

    // Add status filter if not "all"
    if (statusFilter.value && statusFilter.value !== 'all') {
      filters.status = statusFilter.value;
    }

    const response = await adminUserService.getAdminUsers(
      currentPage.value,
      rowsPerPage.value,
      filters,
      getSignal(),
    );

    adminUsers.value = response.data;
    totalRecords.value = response.meta.total;

    // Debug logging
    logger.debug('=== Admin Users Loaded (Paginated) ===');
    logger.debug('Page:', currentPage.value, 'Per Page:', rowsPerPage.value);
    logger.debug('Search:', searchQuery.value);
    logger.debug('Status filter:', statusFilter.value);
    logger.debug('Total records:', totalRecords.value);
    logger.debug('Users on current page:', adminUsers.value.length);
    logger.debug('Meta:', response.meta);
    logger.debug('Links:', response.links);
  } catch (error) {
    // Silently ignore cancelled requests
    if (isRequestCancelled(error)) {
      return;
    }

    showErrorToast(error, 'Failed to load admin users');
  } finally {
    loading.value = false;
  }
};

/**
 * Debounced version of loadAdminUsers for search input
 * Waits 500ms after user stops typing before making API call
 */
const debouncedLoadAdminUsers = useDebounceFn(() => {
  // Reset to first page when searching
  currentPage.value = 1;
  loadAdminUsers();
}, 500);

/**
 * Watch for search query changes
 * Use debounced load to prevent excessive API calls while typing
 */
watch(searchQuery, () => {
  debouncedLoadAdminUsers();
});

/**
 * Watch for status filter changes
 * Load immediately when filter changes (no debounce needed)
 */
watch(statusFilter, () => {
  // Reset to first page when changing filter
  currentPage.value = 1;
  loadAdminUsers();
});

// Modal composable
const {
  viewDialogVisible,
  editDialogVisible,
  createDialogVisible,
  deleteDialogVisible,
  selectedAdminUser,
  createModalRef,
  saving,
  creating,
  deleting,
  openCreateDialog,
  openViewDialog,
  openEditDialog,
  openDeleteDialog,
  openEditFromView,
  openDeleteFromView,
  handleEditCancel,
  handleCreateCancel,
  handleDeleteCancel,
  handleCreate,
  handleSave,
  handleDelete,
  handleReactivate,
} = useAdminUserModals({
  toast,
  onReload: loadAdminUsers,
  currentRoleLevel,
  isEditingOwnProfile,
});

// Status filter options
const statusOptions = [
  { label: 'All Users', value: 'all' },
  { label: 'Active Only', value: 'active' as AdminStatus },
  { label: 'Inactive Only', value: 'inactive' as AdminStatus },
];

/**
 * Available roles for dropdown based on current user's role
 */
const availableRoles = computed(() => {
  const currentRole = adminStore.adminRole;

  if (currentRole === 'super_admin') {
    return [
      { label: getRoleLabel('super_admin'), value: 'super_admin' as AdminRole },
      { label: getRoleLabel('admin'), value: 'admin' as AdminRole },
      { label: getRoleLabel('moderator'), value: 'moderator' as AdminRole },
    ];
  } else if (currentRole === 'admin') {
    return [
      { label: getRoleLabel('admin'), value: 'admin' as AdminRole },
      { label: getRoleLabel('moderator'), value: 'moderator' as AdminRole },
    ];
  } else {
    return [{ label: getRoleLabel('moderator'), value: 'moderator' as AdminRole }];
  }
});

/**
 * Check if current user can edit a specific user
 */
const canEditUser = (user: Admin): boolean => {
  const userLevel = getRoleLevel(user.role);
  return currentRoleLevel.value >= userLevel;
};

/**
 * Check if current user can delete a specific user
 */
const canDeleteUser = (user: Admin): boolean => {
  const userLevel = getRoleLevel(user.role);
  return currentRoleLevel.value >= userLevel;
};

/**
 * Computed property to determine if role edit should be disabled
 */
const disableRoleEditForSelectedUser = computed(() => {
  return isEditingOwnProfile.value;
});

/**
 * Handle pagination event from DataTable
 */
const onPage = (event: DataTablePageEvent): void => {
  currentPage.value = event.page + 1; // PrimeVue uses 0-based page index
  rowsPerPage.value = event.rows;
  loadAdminUsers();
};

/**
 * Wrapper for handleSave that also updates admin store if editing own profile
 */
const saveAdminUser = async (formData: AdminUserUpdateData): Promise<void> => {
  const updatedUser = await handleSave(formData, selectedAdminUser.value);

  // If editing own profile, update admin store as well
  if (updatedUser && isEditingOwnProfile.value && adminStore.admin?.id === updatedUser.id) {
    adminStore.setAdmin(updatedUser);
  }
};

// Load data on mount
onMounted(async () => {
  await loadAdminUsers();
  initialLoading.value = false;
});

/**
 * Clean up pending requests on component unmount
 * Note: useRequestCancellation already handles this automatically,
 * but we explicitly call it here for clarity and documentation
 */
onUnmounted(() => {
  cancelRequests('AdminUsersView component unmounted');
});
</script>

<style scoped></style>
