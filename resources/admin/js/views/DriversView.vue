<template>
  <div class="drivers-view">
    <!-- Header -->
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Driver Management</h1>
          <p class="text-gray-600">Manage all drivers in the system</p>
        </div>
        <Button label="Create Driver" icon="pi pi-plus" @click="handleCreate" />
      </div>
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
      <!-- Search & Filters -->
      <Card class="mb-6">
        <template #content>
          <div class="flex flex-col gap-4">
            <!-- Search -->
            <div class="relative">
              <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <InputText
                :model-value="searchQuery"
                placeholder="Search drivers by name, email, or platform ID..."
                class="w-full pl-10"
                @update:model-value="(value) => driverStore.setSearchQuery(value ?? '')"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Drivers Table -->
      <Card :pt="{ body: { class: 'p-0' }, content: { class: 'p-0' } }">
        <template #content>
          <DriverDataTable
            :drivers="drivers ?? []"
            :loading="loading"
            @view="handleView"
            @edit="handleEdit"
            @delete="handleDelete"
          />
        </template>
      </Card>
    </div>

    <!-- Modals & Drawers -->
    <DriverFormModal
      v-model:visible="formModalVisible"
      :driver="selectedDriver"
      @driver-saved="handleDriverSaved"
      @update:visible="handleFormModalClose"
    />

    <DriverDetailsModal v-model:visible="detailsModalVisible" :driver="selectedDriver" />

    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { storeToRefs } from 'pinia';
import { useDebounceFn } from '@vueuse/core';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Skeleton from 'primevue/skeleton';
import ConfirmDialog from 'primevue/confirmdialog';
import DriverDataTable from '@admin/components/drivers/DriverDataTable.vue';
import DriverFormModal from '@admin/components/drivers/DriverFormModal.vue';
import DriverDetailsModal from '@admin/components/drivers/DriverDetailsModal.vue';
import type { Driver } from '@admin/types/driver';
import { isRequestCancelled } from '@admin/types/errors';
import { useRequestCancellation } from '@admin/composables/useRequestCancellation';
import { useDriverStore } from '@admin/stores/driverStore';
import { useErrorToast } from '@admin/composables/useErrorToast';

// Store and composables
const driverStore = useDriverStore();
const { getSignal, cancel: cancelRequests } = useRequestCancellation();
const { showErrorToast, showSuccessToast } = useErrorToast();
const confirm = useConfirm();

// Destructure store state and getters with reactivity
const { drivers, loading, searchQuery } = storeToRefs(driverStore);

// Local modal state
const initialLoading = ref(true);
const formModalVisible = ref(false);
const detailsModalVisible = ref(false);
const selectedDriver = ref<Driver | null>(null);

/**
 * Load drivers from server using store
 */
const loadDrivers = async () => {
  try {
    // Cancel any pending requests before starting a new one
    cancelRequests('Loading new data');

    await driverStore.fetchDrivers(getSignal());
  } catch (error) {
    // Silently ignore cancelled requests
    if (isRequestCancelled(error)) {
      return;
    }

    showErrorToast(error, 'Failed to load drivers');
  }
};

/**
 * Debounced version of loadDrivers for search input
 * Waits 500ms after user stops typing before making API call
 */
const debouncedLoadDrivers = useDebounceFn(() => {
  loadDrivers();
}, 500);

/**
 * Watch for search query changes
 * Use debounced load to prevent excessive API calls while typing
 */
watch(searchQuery, () => {
  debouncedLoadDrivers();
});

/**
 * Handle create new driver button click
 */
const handleCreate = () => {
  selectedDriver.value = null;
  formModalVisible.value = true;
};

/**
 * Handle view driver details
 */
const handleView = (driver: Driver) => {
  selectedDriver.value = driver;
  detailsModalVisible.value = true;
};

/**
 * Handle edit driver
 */
const handleEdit = (driver: Driver) => {
  selectedDriver.value = driver;
  formModalVisible.value = true;
};

/**
 * Handle delete driver
 */
const handleDelete = (driver: Driver) => {
  confirm.require({
    message: `Are you sure you want to delete "${driver.display_name}"? This action cannot be undone.`,
    header: 'Confirm Delete',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await driverStore.deleteDriver(driver.id, getSignal());
        showSuccessToast('Driver deleted successfully');
      } catch (error) {
        // Silently ignore cancelled requests
        if (isRequestCancelled(error)) {
          return;
        }

        showErrorToast(error, 'Failed to delete driver');
      }
    },
  });
};

/**
 * Handle driver saved (created or updated)
 */
const handleDriverSaved = async () => {
  formModalVisible.value = false;
  selectedDriver.value = null;
  await loadDrivers();
};

/**
 * Handle form modal close
 */
const handleFormModalClose = (visible: boolean) => {
  if (!visible) {
    selectedDriver.value = null;
  }
};

onMounted(async () => {
  await loadDrivers();
  initialLoading.value = false;
});

onUnmounted(() => {
  cancelRequests('Component unmounted');
});
</script>

<style scoped></style>
