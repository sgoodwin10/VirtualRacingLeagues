<script setup lang="ts">
import { computed } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import DriverStatusBadge from './DriverStatusBadge.vue';
import type { LeagueDriver } from '@user/types/driver';
import type { Platform } from '@user/types/league';

interface Props {
  drivers?: LeagueDriver[];
  loading?: boolean;
  leaguePlatforms?: Platform[];
}

interface Emits {
  (e: 'edit', driver: LeagueDriver): void;
  (e: 'remove', driver: LeagueDriver): void;
  (e: 'view', driver: LeagueDriver): void;
}

const props = withDefaults(defineProps<Props>(), {
  drivers: () => [],
  loading: false,
  leaguePlatforms: () => [],
});
const emit = defineEmits<Emits>();

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
 * Check if league uses a specific platform
 */
const hasPlatform = computed(() => {
  const platformSlugs = props.leaguePlatforms.map(p => p.slug.toLowerCase());
  return {
    psn: platformSlugs.includes('playstation') || platformSlugs.includes('psn'),
    gt7: platformSlugs.includes('gran turismo') || platformSlugs.includes('gt7'),
    iracing: platformSlugs.includes('iracing'),
  };
});

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
</script>

<template>
  <DataTable
    :value="props.drivers || []"
    :loading="props.loading"
    striped-rows
    paginator
    :rows="15"
    :rows-per-page-options="[15, 25, 50]"
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

    <Column field="driver_number" header="#" style="width: 80px">
      <template #body="{ data }">
        <span class="font-semibold">{{ data.driver_number ?? '-' }}</span>
      </template>
    </Column>

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

    <!-- Platform Columns - Only show platforms used by the league -->
    <Column v-if="hasPlatform.psn" field="driver.psn_id" header="PSN ID" style="width: 150px">
      <template #body="{ data }">
        <span class="text-sm">{{ data.driver?.psn_id || '-' }}</span>
      </template>
    </Column>

    <Column v-if="hasPlatform.gt7" field="driver.gt7_id" header="GT7 ID" style="width: 150px">
      <template #body="{ data }">
        <span class="text-sm">{{ data.driver?.gt7_id || '-' }}</span>
      </template>
    </Column>

    <Column
      v-if="hasPlatform.iracing"
      field="driver.iracing_id"
      header="iRacing ID"
      style="width: 150px"
    >
      <template #body="{ data }">
        <span class="text-sm">{{ data.driver?.iracing_id || '-' }}</span>
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
