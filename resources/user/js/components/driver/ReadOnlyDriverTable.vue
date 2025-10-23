<script setup lang="ts">
import { ref, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import { PhEye, PhPencilSimple } from '@phosphor-icons/vue';
import ViewDriverModal from './ViewDriverModal.vue';
import DriverFormDialog from './modals/DriverFormDialog.vue';
import { useLeagueStore } from '@user/stores/leagueStore';
import { useDriverStore } from '@user/stores/driverStore';
import type { LeagueDriver, CreateDriverRequest, UpdateDriverRequest } from '@user/types/driver';

interface Props {
  drivers?: LeagueDriver[];
  loading?: boolean;
  leagueId?: number;
}

interface Emits {
  (e: 'driver-updated'): void;
}

const props = withDefaults(defineProps<Props>(), {
  drivers: () => [],
  loading: false,
  leagueId: undefined,
});

const emit = defineEmits<Emits>();

const leagueStore = useLeagueStore();
const driverStore = useDriverStore();

// Modal state management
const viewModalVisible = ref(false);
const editModalVisible = ref(false);
const selectedDriver = ref<LeagueDriver | null>(null);

/**
 * Get driver's display name from nested driver object
 */
const getDriverName = (leagueDriver: LeagueDriver): string => {
  return leagueDriver.driver?.display_name || 'Unknown';
};

/**
 * Get driver's nickname if different from display name
 */
const getDriverNickname = (leagueDriver: LeagueDriver): string | null => {
  const driver = leagueDriver.driver;
  if (!driver) return null;

  // Only show nickname if it exists and is different from first/last name
  if (driver.nickname && (driver.first_name || driver.last_name)) {
    return driver.nickname;
  }
  return null;
};

/**
 * Get the value for a dynamic platform column
 */
const getPlatformValue = (leagueDriver: LeagueDriver, field: string): string => {
  const driver = leagueDriver.driver;
  if (!driver) return '-';

  // Access the field dynamically from the driver object
  const value = driver[field as keyof typeof driver];
  return value != null ? String(value) : '-';
};

/**
 * Handle view button click
 */
const handleViewDriver = (driver: LeagueDriver): void => {
  selectedDriver.value = driver;
  viewModalVisible.value = true;
};

/**
 * Handle edit button click
 */
const handleEditDriver = (driver: LeagueDriver): void => {
  selectedDriver.value = driver;
  editModalVisible.value = true;
};

/**
 * Handle view modal edit event
 */
const handleViewModalEdit = (): void => {
  viewModalVisible.value = false;
  editModalVisible.value = true;
};

/**
 * Handle edit modal save event
 */
const handleEditModalSave = async (data: CreateDriverRequest): Promise<void> => {
  if (!selectedDriver.value || !props.leagueId) {
    console.error('Cannot save: missing driver or league ID');
    return;
  }

  try {
    // Cast CreateDriverRequest to UpdateDriverRequest (they have the same shape)
    const updateData = data as UpdateDriverRequest;

    // Call the store to update the driver
    await driverStore.updateDriver(props.leagueId, selectedDriver.value.driver_id, updateData);

    // Close modal and reset selection
    editModalVisible.value = false;
    selectedDriver.value = null;

    // Emit event to notify parent component
    emit('driver-updated');
  } catch (error) {
    console.error('Failed to update driver:', error);
    // TODO: Add toast notification for error
  }
};

/**
 * Handle view modal close event
 */
const handleViewModalClose = (): void => {
  viewModalVisible.value = false;
  selectedDriver.value = null;
};

/**
 * Handle edit modal cancel event
 */
const handleEditModalCancel = (): void => {
  editModalVisible.value = false;
  selectedDriver.value = null;
};

/**
 * Fetch platform columns on mount if league is provided
 */
onMounted(async () => {
  if (props.leagueId) {
    try {
      await leagueStore.fetchDriverColumnsForLeague(props.leagueId);
    } catch (error) {
      console.error('Failed to fetch platform columns:', error);
    }
  }
});
</script>

<template>
  <DataTable
    :value="props.drivers || []"
    :loading="props.loading"
    striped-rows
    paginator
    :rows="10"
    :rows-per-page-options="[10, 25, 50]"
    data-key="id"
    responsive-layout="scroll"
    class="read-only-driver-table"
  >
    <template #empty>
      <div class="text-center py-8 text-gray-500">No drivers found.</div>
    </template>

    <template #loading>
      <div class="text-center py-8 text-gray-500">Loading drivers...</div>
    </template>

    <Column field="name" header="Name" style="min-width: 80px">
      <template #body="{ data }">
        <div>
          <div class="font-semibold">{{ getDriverName(data) }}</div>
          <div v-if="getDriverNickname(data)" class="text-sm text-gray-600">
            "{{ getDriverNickname(data) }}"
          </div>
        </div>
      </template>
    </Column>

    <!-- Dynamic Platform Columns - Rendered based on league's platforms -->
    <Column
      v-for="column in leagueStore.platformColumns"
      :key="column.field"
      :field="`driver.${column.field}`"
      :header="column.label"
      style="min-width: 80px"
    >
      <template #body="{ data }">
        <span class="text-sm">{{ getPlatformValue(data, column.field) }}</span>
      </template>
    </Column>

    <!-- Actions Column -->
    <Column header="Actions" style="width: 100px; text-align: center">
      <template #body="{ data }">
        <div class="flex items-center justify-center gap-1">
          <Button
            severity="secondary"
            text
            rounded
            title="View Details"
            @click="handleViewDriver(data)"
          >
            <template #icon>
              <PhEye :size="20" />
            </template>
          </Button>
          <Button severity="info" text rounded title="Edit Driver" @click="handleEditDriver(data)">
            <template #icon>
              <PhPencilSimple :size="20" />
            </template>
          </Button>
        </div>
      </template>
    </Column>
  </DataTable>

  <!-- View Driver Modal -->
  <ViewDriverModal
    v-model:visible="viewModalVisible"
    :driver="selectedDriver"
    @close="handleViewModalClose"
    @edit="handleViewModalEdit"
  />

  <!-- Edit Driver Modal -->
  <DriverFormDialog
    v-model:visible="editModalVisible"
    mode="edit"
    :driver="selectedDriver"
    :league-id="leagueId"
    @save="handleEditModalSave"
    @cancel="handleEditModalCancel"
  />
</template>

<style scoped>
.read-only-driver-table :deep(.p-datatable-table) {
}
</style>
