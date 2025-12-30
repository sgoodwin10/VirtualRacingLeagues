<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Drawer from 'primevue/drawer';
import { Button } from '@app/components/common/buttons';
import { PhUpload, PhPlus } from '@phosphor-icons/vue';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Toast from 'primevue/toast';
import DriverTable from './DriverTable.vue';
import DriverFormDialog from './modals/DriverFormDialog.vue';
import ViewDriverModal from './ViewDriverModal.vue';
import CSVImportDialog from './modals/CSVImportDialog.vue';
import DrawerHeader from '@app/components/common/modals/DrawerHeader.vue';
import { useDriverStore } from '@app/stores/driverStore';
import { useDebouncedSearch } from '@app/composables/useDebouncedSearch';
import type { LeagueDriver, CreateDriverRequest } from '@app/types/driver';
import type { Platform } from '@app/types/league';

interface Props {
  visible: boolean;
  leagueId: number;
  leagueName: string;
  leaguePlatforms?: Platform[];
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'close'): void;
}

const props = withDefaults(defineProps<Props>(), {
  leaguePlatforms: () => [],
});
const _emit = defineEmits<Emits>();

const toast = useToast();
const confirm = useConfirm();
const driverStore = useDriverStore();

// Dialog states
const showDriverForm = ref(false);
const showViewModal = ref(false);
const showCSVImport = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const selectedDriver = ref<LeagueDriver | null>(null);

// Search and filter
const searchInput = ref('');
const statusFilterOptions = [
  { label: 'All Drivers', value: 'all' },
  { label: 'Active Only', value: 'active' },
  { label: 'Inactive Only', value: 'inactive' },
  { label: 'Banned Only', value: 'banned' },
];

// Computed
const drawerTitle = computed(() => `${props.leagueName} - Drivers`);

// Watch for visibility changes
watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      await loadDrivers();
    } else {
      // Reset store when drawer closes
      driverStore.resetFilters();
    }
  },
);

// Setup debounced search using composable
// Note: isSearching available but not currently displayed in UI
const { isSearching: _isSearching } = useDebouncedSearch(
  searchInput,
  async (query, _signal) => {
    driverStore.setSearchQuery(query);
    await loadDrivers();
  },
  300,
);

// Watch for status filter changes
watch(
  () => driverStore.statusFilter,
  () => {
    loadDrivers();
  },
);

// Watch for page changes
watch(
  () => driverStore.currentPage,
  () => {
    loadDrivers();
  },
);

/**
 * Load drivers for the league
 */
const loadDrivers = async (): Promise<void> => {
  try {
    await driverStore.fetchLeagueDrivers(props.leagueId);
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load drivers',
      life: 3000,
    });
  }
};

/**
 * Handle add driver button click
 */
const handleAddDriver = (): void => {
  formMode.value = 'create';
  selectedDriver.value = null;
  showDriverForm.value = true;
};

/**
 * Handle view driver button click
 */
const handleViewDriver = (driver: LeagueDriver): void => {
  selectedDriver.value = driver;
  showViewModal.value = true;
};

/**
 * Handle edit driver button click
 */
const handleEditDriver = (driver: LeagueDriver): void => {
  formMode.value = 'edit';
  selectedDriver.value = driver;
  showDriverForm.value = true;
};

/**
 * Handle edit from view modal
 */
const handleEditFromView = (): void => {
  showViewModal.value = false;
  if (selectedDriver.value) {
    handleEditDriver(selectedDriver.value);
  }
};

/**
 * Handle driver form save
 */
const handleSaveDriver = async (data: CreateDriverRequest): Promise<void> => {
  try {
    if (formMode.value === 'create') {
      await driverStore.createNewDriver(props.leagueId, data);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Driver added successfully',
        life: 3000,
      });
    } else if (selectedDriver.value) {
      // In edit mode, update both driver fields and league-specific settings
      // Use driver_id (the actual driver ID), not id (the league_driver pivot ID)
      await driverStore.updateDriver(props.leagueId, selectedDriver.value.driver_id, data);
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Driver updated successfully',
        life: 3000,
      });
    }
    showDriverForm.value = false;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error instanceof Error ? error.message : 'Failed to save driver',
      life: 5000,
    });
  }
};

/**
 * Handle remove driver button click
 */
const handleRemoveDriver = (driver: LeagueDriver): void => {
  confirm.require({
    message: `Are you sure you want to remove ${getDriverName(driver)} from this league?`,
    header: 'Confirm Removal',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Remove',
    rejectLabel: 'Cancel',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        // Use driver_id (the actual driver ID), not id (the league_driver pivot ID)
        await driverStore.removeDriver(props.leagueId, driver.driver_id);
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Driver removed from league',
          life: 3000,
        });
      } catch {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to remove driver',
          life: 3000,
        });
      }
    },
  });
};

/**
 * Handle import CSV button click
 */
const handleImportCSV = (): void => {
  showCSVImport.value = true;
};

/**
 * Handle CSV import
 */
const handleCSVImport = async (csvData: string) => {
  const result = await driverStore.importCSV(props.leagueId, csvData);

  if (result.errors.length === 0) {
    const message =
      result.success_count === 1
        ? 'Successfully imported 1 driver'
        : `Successfully imported ${result.success_count} drivers`;

    toast.add({
      severity: 'success',
      summary: 'Import Successful',
      detail: message,
      life: 3000,
    });
  } else if (result.success_count > 0) {
    const message = `Imported ${result.success_count} driver${result.success_count === 1 ? '' : 's'} with ${result.errors.length} error${result.errors.length === 1 ? '' : 's'}`;

    toast.add({
      severity: 'warn',
      summary: 'Partial Import',
      detail: message,
      life: 5000,
    });
  }

  return result;
};

/**
 * Get driver's display name
 */
const getDriverName = (leagueDriver: LeagueDriver): string => {
  return leagueDriver.driver?.display_name || 'Unknown';
};

// Load drivers on mount if visible
onMounted(() => {
  if (props.visible) {
    loadDrivers();
  }
});
</script>

<template>
  <div>
    <Drawer
      :visible="visible"
      position="bottom"
      class="!h-[50vh]"
      @update:visible="$emit('update:visible', $event)"
    >
      <template #header>
        <DrawerHeader :title="drawerTitle" subtitle="Manage drivers for this league" />
      </template>

      <div class="container mx-auto flex flex-col max-w-5xl px-4 h-full">
        <!-- Toolbar -->
        <div class="flex flex-wrap gap-4 items-center justify-between mb-4">
          <!-- Search and Filter -->
          <div class="flex gap-2 flex-1">
            <IconField>
              <InputIcon class="pi pi-search" />
              <InputText v-model="searchInput" placeholder="Search drivers..." class="w-full" />
            </IconField>
            <Select
              v-model="driverStore.statusFilter"
              :options="statusFilterOptions"
              option-label="label"
              option-value="value"
              placeholder="Filter by status"
              class="w-48"
            />
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2">
            <Button
              label="Import CSV"
              :icon="PhUpload"
              variant="secondary"
              @click="handleImportCSV"
            />
            <Button label="Add Driver" :icon="PhPlus" @click="handleAddDriver" />
          </div>
        </div>

        <!-- Driver Table -->
        <div class="flex-1 overflow-auto">
          <DriverTable
            :league-id="leagueId"
            @view="handleViewDriver"
            @edit="handleEditDriver"
            @remove="handleRemoveDriver"
          />
        </div>
      </div>
    </Drawer>

    <!-- View Driver Modal -->
    <ViewDriverModal
      v-model:visible="showViewModal"
      :driver="selectedDriver"
      @close="showViewModal = false"
      @edit="handleEditFromView"
    />

    <!-- Driver Form Dialog -->
    <DriverFormDialog
      v-model:visible="showDriverForm"
      :mode="formMode"
      :driver="selectedDriver"
      :league-id="leagueId"
      @save="handleSaveDriver"
      @cancel="showDriverForm = false"
    />

    <!-- CSV Import Dialog -->
    <CSVImportDialog
      v-model:visible="showCSVImport"
      :league-id="leagueId"
      :on-import="handleCSVImport"
      @close="showCSVImport = false"
    />

    <!-- Toast for notifications -->
    <Toast />
  </div>
</template>

<style scoped>
/* Custom styles if needed */
</style>
