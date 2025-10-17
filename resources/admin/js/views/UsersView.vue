<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { storeToRefs } from 'pinia';
import { useDebounceFn } from '@vueuse/core';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Card from 'primevue/card';
import Skeleton from 'primevue/skeleton';
import ConfirmDialog from 'primevue/confirmdialog';
import UsersTable from '@admin/components/User/UsersTable.vue';
import ViewUserModal from '@admin/components/User/modals/ViewUserModal.vue';
import EditUserModal from '@admin/components/User/modals/EditUserModal.vue';
import CreateUserModal from '@admin/components/User/modals/CreateUserModal.vue';
import type { User } from '@admin/types/user';
import { isRequestCancelled } from '@admin/types/errors';
import { useRequestCancellation } from '@admin/composables/useRequestCancellation';
import { useUserStore } from '@admin/stores/userStore';
import { useErrorToast } from '@admin/composables/useErrorToast';

// Store and composables
const userStore = useUserStore();
const { getSignal, cancel: cancelRequests } = useRequestCancellation();
const { showErrorToast, showSuccessToast } = useErrorToast();
const confirm = useConfirm();

// Destructure store state and getters with reactivity
const { users, loading, searchQuery, statusFilter } = storeToRefs(userStore);

// Local modal state
const initialLoading = ref(true);
const viewModalVisible = ref(false);
const editModalVisible = ref(false);
const createModalVisible = ref(false);
const selectedUser = ref<User | null>(null);

const statusOptions = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Suspended', value: 'suspended' },
];

/**
 * Load users from server using store
 */
const loadUsers = async () => {
  try {
    // Cancel any pending requests before starting a new one
    cancelRequests('Loading new data');

    await userStore.fetchUsers(getSignal());
  } catch (error) {
    // Silently ignore cancelled requests
    if (isRequestCancelled(error)) {
      return;
    }

    showErrorToast(error, 'Failed to load users');
  }
};

/**
 * Debounced version of loadUsers for search input
 * Waits 500ms after user stops typing before making API call
 */
const debouncedLoadUsers = useDebounceFn(() => {
  loadUsers();
}, 500);

/**
 * Watch for search query changes
 * Use debounced load to prevent excessive API calls while typing
 */
watch(searchQuery, () => {
  debouncedLoadUsers();
});

/**
 * Watch for status filter changes
 * Load immediately when filter changes (no debounce needed)
 */
watch(statusFilter, () => {
  loadUsers();
});

const handleView = (user: User) => {
  selectedUser.value = user;
  viewModalVisible.value = true;
};

const handleEdit = (user: User) => {
  selectedUser.value = user;
  editModalVisible.value = true;
};

const handleCreate = () => {
  createModalVisible.value = true;
};

const handleDeactivate = (user: User) => {
  const userName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
  confirm.require({
    message: `Are you sure you want to deactivate ${userName}?`,
    header: 'Confirm Deactivation',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        await userStore.deleteUser(user.id, getSignal());
        showSuccessToast('User deactivated successfully');
      } catch (error) {
        // Silently ignore cancelled requests
        if (isRequestCancelled(error)) {
          return;
        }

        showErrorToast(error, 'Failed to deactivate user');
      }
    },
  });
};

const handleReactivate = async (user: User) => {
  try {
    await userStore.reactivateUser(user.id, getSignal());
    showSuccessToast('User reactivated successfully');
  } catch (error) {
    // Silently ignore cancelled requests
    if (isRequestCancelled(error)) {
      return;
    }

    showErrorToast(error, 'Failed to reactivate user');
  }
};

const handleUserCreated = () => {
  createModalVisible.value = false;
  loadUsers();
};

const handleUserUpdated = () => {
  editModalVisible.value = false;
  loadUsers();
};

onMounted(async () => {
  await loadUsers();
  initialLoading.value = false;
});
</script>

<template>
  <div class="users-view">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">User Management</h1>
      <p class="text-gray-600">Manage all users in the system</p>
    </div>

    <!-- Initial Loading Skeleton -->
    <div v-if="initialLoading" class="space-y-6">
      <Card>
        <template #content>
          <Skeleton height="4rem" />
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
      <!-- Filters & Actions -->
      <Card class="mb-6">
        <template #content>
          <div class="flex gap-4">
            <InputText
              :model-value="searchQuery"
              placeholder="Search users..."
              class="flex-1"
              @update:model-value="(value) => userStore.setSearchQuery(value ?? '')"
            />
            <Select
              :model-value="statusFilter"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              placeholder="Filter by status"
              class="w-48"
              @update:model-value="
                (value: string) =>
                  userStore.setStatusFilter(value as 'active' | 'inactive' | 'suspended' | 'all')
              "
            />
            <Button
              label="Create User"
              icon="pi pi-plus"
              severity="success"
              @click="handleCreate"
            />
          </div>
        </template>
      </Card>

      <!-- Users Table -->
      <Card :pt="{ body: { class: 'p-0' }, content: { class: 'p-0' } }">
        <template #content>
          <UsersTable
            :users="users ?? []"
            :loading="loading"
            @view="handleView"
            @edit="handleEdit"
            @deactivate="handleDeactivate"
            @reactivate="handleReactivate"
          />
        </template>
      </Card>
    </div>

    <ViewUserModal v-model:visible="viewModalVisible" :user="selectedUser" />
    <EditUserModal
      v-model:visible="editModalVisible"
      :user="selectedUser"
      @user-updated="handleUserUpdated"
    />
    <CreateUserModal v-model:visible="createModalVisible" @user-created="handleUserCreated" />
    <ConfirmDialog />
  </div>
</template>

<style scoped></style>
