<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { storeToRefs } from 'pinia';
import Column from 'primevue/column';
import { useLeagueStore } from '@app/stores/leagueStore';
import { TechDataTable, DriverCell } from '@app/components/common/tables';
import { Button } from '@app/components/common/buttons';
import { useDriverStore } from '@app/stores/driverStore';
import type { LeagueDriver, Driver } from '@app/types/driver';
import type { DataTablePageEvent } from 'primevue/datatable';
import { createLogger } from '@app/utils/logger';
import { ROWS_PER_PAGE_OPTIONS } from '@app/constants/pagination';
import { PhEye, PhPencil, PhTrash } from '@phosphor-icons/vue';

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

// Use storeToRefs instead of manual computed wrappers
const { drivers, loading, totalDrivers, currentPage, perPage } = storeToRefs(driverStore);
const { platformColumns } = storeToRefs(leagueStore);

// Computed property for pagination first index
const first = computed(() => (currentPage.value - 1) * perPage.value);

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
  <TechDataTable
    :value="drivers"
    :loading="loading"
    lazy
    paginator
    :rows="perPage"
    :rows-per-page-options="ROWS_PER_PAGE_OPTIONS"
    :total-records="totalDrivers"
    :first="first"
    entity-name="drivers"
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
        <DriverCell :name="getDriverName(data)" :nickname="getDriverNickname(data)" />
      </template>
    </Column>

    <Column field="discord_id" header="Discord ID">
      <template #body="{ data }">
        {{ getDriverDiscordId(data) }}
      </template>
    </Column>

    <!-- Dynamic Platform Columns - Rendered based on league's platforms -->
    <Column
      v-for="column in platformColumns"
      :key="column.field"
      :field="`driver.${column.field}`"
      :header="column.label"
    >
      <template #body="{ data }">
        {{ getPlatformValue(data, column.field) }}
      </template>
    </Column>

    <Column header="Actions" style="width: 200px">
      <template #body="{ data }">
        <div class="flex gap-2">
          <Button
            :icon="PhEye"
            size="sm"
            variant="outline"
            :title="`View ${getDriverName(data)}`"
            aria-label="View driver details"
            @click="handleView(data)"
          />
          <Button
            :icon="PhPencil"
            size="sm"
            variant="warning"
            aria-label="Edit driver"
            :title="`Edit ${getDriverName(data)}`"
            @click="handleEdit(data)"
          />
          <Button
            :icon="PhTrash"
            size="sm"
            variant="danger"
            aria-label="Remove driver"
            :title="`Remove ${getDriverName(data)} from league`"
            @click="handleRemove(data)"
          />
        </div>
      </template>
    </Column>
  </TechDataTable>
</template>

<style scoped>
.driver-table :deep(.p-datatable-table) {
  min-width: 800px;
}
</style>
