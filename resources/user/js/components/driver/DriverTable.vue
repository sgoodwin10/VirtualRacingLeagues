<script setup lang="ts">
import { onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import DriverStatusBadge from './DriverStatusBadge.vue';
import { useLeagueStore } from '@user/stores/leagueStore';
import type { LeagueDriver } from '@user/types/driver';

interface Props {
  drivers?: LeagueDriver[];
  loading?: boolean;
  leagueId?: number;
}

interface Emits {
  (e: 'edit', driver: LeagueDriver): void;
  (e: 'remove', driver: LeagueDriver): void;
  (e: 'view', driver: LeagueDriver): void;
}

const props = withDefaults(defineProps<Props>(), {
  drivers: () => [],
  loading: false,
  leagueId: undefined,
});
const emit = defineEmits<Emits>();

const leagueStore = useLeagueStore();

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
    class="driver-table"
  >
    <template #empty>
      <div class="text-center py-8 text-gray-500">No drivers found.</div>
    </template>

    <template #loading>
      <div class="text-center py-8 text-gray-500">Loading drivers...</div>
    </template>

    <Column field="status" header="Status" style="width: 120px">
      <template #body="{ data }">
        <DriverStatusBadge :status="data.status" />
      </template>
    </Column>

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

    <Column field="discord_id" header="Discord ID" style="width: 180px">
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
      style="width: 150px"
    >
      <template #body="{ data }">
        <span class="text-sm">{{ getPlatformValue(data, column.field) }}</span>
      </template>
    </Column>

    <Column header="Actions" style="width: 200px">
      <template #body="{ data }">
        <div class="flex gap-2">
          <Button
            label="View"
            size="small"
            text
            severity="secondary"
            aria-label="View driver details"
            @click="handleView(data)"
          />
          <Button
            label="Edit"
            size="small"
            text
            aria-label="Edit driver"
            @click="handleEdit(data)"
          />
          <Button
            icon="pi pi-times"
            size="small"
            text
            severity="danger"
            aria-label="Remove driver"
            @click="handleRemove(data)"
          />
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
