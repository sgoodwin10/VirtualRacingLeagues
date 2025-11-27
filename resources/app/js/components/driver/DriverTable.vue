<script setup lang="ts">
import { onMounted, computed } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { useLeagueStore } from '@app/stores/leagueStore';
import ViewButton from '@app/components/common/buttons/ViewButton.vue';
import EditButton from '@app/components/common/buttons/EditButton.vue';
import DeleteButton from '@app/components/common/buttons/DeleteButton.vue';
import { useDriverStore } from '@app/stores/driverStore';
import type { LeagueDriver, Driver } from '@app/types/driver';
import type { DataTablePageEvent } from 'primevue/datatable';
import { createLogger } from '@app/utils/logger';
import { DEFAULT_ROWS_PER_PAGE, ROWS_PER_PAGE_OPTIONS } from '@app/constants/pagination';

interface Props {
  leagueId?: number;
}

interface Emits {
  (e: 'edit', driver: LeagueDriver): void;
  (e: 'remove', driver: LeagueDriver): void;
  (e: 'view', driver: LeagueDriver): void;
}

const props = withDefaults(defineProps<Props>(), {
  leagueId: undefined,
});
const emit = defineEmits<Emits>();

const leagueStore = useLeagueStore();
const driverStore = useDriverStore();
const logger = createLogger('DriverTable');

// Computed properties bound to store
const drivers = computed(() => driverStore.drivers);
const loading = computed(() => driverStore.loading);
const totalRecords = computed(() => driverStore.totalDrivers);
const first = computed(() => (driverStore.currentPage - 1) * driverStore.perPage);

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
 * Get driver's Discord ID
 */
const getDriverDiscordId = (leagueDriver: LeagueDriver): string => {
  return leagueDriver.driver?.discord_id || '-';
};

/**
 * Type-safe helper to check if a key exists on the Driver object
 */
const isValidDriverKey = (key: string, obj: Driver): key is keyof Driver => {
  return key in obj;
};

/**
 * Get the value for a dynamic platform column
 */
const getPlatformValue = (leagueDriver: LeagueDriver, field: string): string => {
  const driver = leagueDriver.driver;
  if (!driver) return '-';

  // Type-safe field access using runtime check
  if (isValidDriverKey(field, driver)) {
    const value = driver[field];
    return value != null ? String(value) : '-';
  }

  return '-';
};

/**
 * Handle edit button click
 */
const handleEdit = (driver: LeagueDriver): void => {
  emit('edit', driver);
};

/**
 * Handle view button click
 */
const handleView = (driver: LeagueDriver): void => {
  emit('view', driver);
};

/**
 * Handle remove button click
 */
const handleRemove = (driver: LeagueDriver): void => {
  emit('remove', driver);
};

/**
 * Handle pagination change event
 */
const handlePageChange = async (event: DataTablePageEvent): Promise<void> => {
  if (!props.leagueId) return;

  const page = event.page + 1; // PrimeVue uses 0-based pages
  const perPage = event.rows;

  try {
    await driverStore.fetchLeagueDrivers(props.leagueId, {
      page,
      per_page: perPage,
    });
  } catch (error) {
    logger.error('Failed to fetch drivers', { data: error });
  }
};

/**
 * Fetch platform columns and initial drivers on mount if league is provided
 */
onMounted(async () => {
  if (props.leagueId) {
    try {
      // Fetch platform columns for dynamic columns
      await leagueStore.fetchDriverColumnsForLeague(props.leagueId);

      // Fetch initial driver data
      await driverStore.fetchLeagueDrivers(props.leagueId);
    } catch (error) {
      logger.error('Failed to fetch initial data', { data: error });
    }
  }
});
</script>

<template>
  <DataTable
    :value="drivers"
    :loading="loading"
    lazy
    striped-rows
    paginator
    :rows="DEFAULT_ROWS_PER_PAGE"
    :rows-per-page-options="ROWS_PER_PAGE_OPTIONS"
    :total-records="totalRecords"
    :first="first"
    data-key="id"
    responsive-layout="scroll"
    class="driver-table"
    @page="handlePageChange"
  >
    <template #empty>
      <div class="text-center py-8 text-gray-500">No drivers found.</div>
    </template>

    <template #loading>
      <div class="text-center py-8 text-gray-500">Loading drivers...</div>
    </template>

    <Column field="name" header="Name">
      <template #body="{ data }">
        <div>
          <div class="font-semibold">{{ getDriverName(data) }}</div>
          <div v-if="getDriverNickname(data)" class="text-sm text-gray-600">
            "{{ getDriverNickname(data) }}"
          </div>
        </div>
      </template>
    </Column>

    <Column field="discord_id" header="Discord ID">
      <template #body="{ data }">
        <span class="text-sm">{{ getDriverDiscordId(data) }}</span>
      </template>
    </Column>

    <!-- Dynamic Platform Columns - Rendered based on league's platforms -->
    <Column
      v-for="column in leagueStore.platformColumns"
      :key="column.field"
      :field="`driver.${column.field}`"
      :header="column.label"
    >
      <template #body="{ data }">
        <span class="text-sm">{{ getPlatformValue(data, column.field) }}</span>
      </template>
    </Column>

    <Column header="Actions" style="width: 200px">
      <template #body="{ data }">
        <div class="flex gap-2">
          <ViewButton aria-label="View driver details" @click="handleView(data)" />
          <EditButton aria-label="Edit driver" @click="handleEdit(data)" />
          <DeleteButton aria-label="Remove driver" @click="handleRemove(data)" />
        </div>
      </template>
    </Column>
  </DataTable>
</template>

<style scoped>
.driver-table :deep(.p-datatable-table) {
  min-width: 800px;
}
</style>
