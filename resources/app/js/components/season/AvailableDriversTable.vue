<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useSeasonDriverStore } from '@app/stores/seasonDriverStore';
import type { AvailableDriver } from '@app/types/seasonDriver';
import { usesPsnId, usesIracingId } from '@app/constants/platforms';

import DataTable from 'primevue/datatable';
import type { DataTablePageEvent } from 'primevue/datatable';
import Column from 'primevue/column';
import { ViewButton, AddButton } from '@app/components/common/buttons';
import { createLogger } from '@app/utils/logger';
import { DEFAULT_ROWS_PER_PAGE, ROWS_PER_PAGE_OPTIONS } from '@app/constants/pagination';

interface Props {
  seasonId: number;
  leagueId: number;
  platformId?: number;
}

const props = withDefaults(defineProps<Props>(), {
  platformId: undefined,
});

interface Emits {
  (e: 'view', driver: AvailableDriver): void;
  (e: 'add', driver: AvailableDriver): void;
}

const emit = defineEmits<Emits>();

const seasonDriverStore = useSeasonDriverStore();
const logger = createLogger('AvailableDriversTable');

const availableDrivers = computed(() => seasonDriverStore.availableDrivers);
const loading = computed(() => seasonDriverStore.loadingAvailable);
const totalRecords = computed(() => seasonDriverStore.totalAvailable);
const first = computed(
  () => (seasonDriverStore.availablePage - 1) * seasonDriverStore.availablePerPage,
);

const showPsnColumn = computed(() => usesPsnId(props.platformId));

const showIracingColumn = computed(() => usesIracingId(props.platformId));

function getDriverDisplayName(driver: AvailableDriver): string {
  // Backend already computes and returns driver_name
  return driver.driver_name || 'Unknown Driver';
}

function handleView(driver: AvailableDriver): void {
  emit('view', driver);
}

function handleAdd(driver: AvailableDriver): void {
  emit('add', driver);
}

/**
 * Handle pagination change event
 */
async function handlePageChange(event: DataTablePageEvent): Promise<void> {
  const page = event.page + 1; // PrimeVue uses 0-based pages
  const perPage = event.rows;

  try {
    await seasonDriverStore.fetchAvailableDrivers(props.seasonId, props.leagueId, {
      page,
      per_page: perPage,
    });
  } catch (error) {
    logger.error('Failed to fetch available drivers', { data: error });
  }
}

/**
 * Load initial available drivers on mount
 */
onMounted(async () => {
  try {
    await seasonDriverStore.fetchAvailableDrivers(props.seasonId, props.leagueId);
  } catch (error) {
    logger.error('Failed to load available drivers', { data: error });
  }
});
</script>

<template>
  <div class="available-drivers-table">
    <DataTable
      :value="availableDrivers"
      :loading="loading"
      lazy
      paginator
      :rows="DEFAULT_ROWS_PER_PAGE"
      :rows-per-page-options="ROWS_PER_PAGE_OPTIONS"
      :total-records="totalRecords"
      :first="first"
      striped-rows
      responsive-layout="scroll"
      @page="handlePageChange"
    >
      <template #empty>
        <div class="text-center py-8">
          <i class="pi pi-check-circle text-4xl text-green-400 mb-3"></i>
          <p class="text-gray-600">All league drivers are already in this season.</p>
        </div>
      </template>

      <template #loading>
        <div class="text-center py-8 text-gray-500">Loading available drivers...</div>
      </template>

      <Column field="driver_name" header="Driver">
        <template #body="{ data }">
          <span class="font-semibold">{{ getDriverDisplayName(data) }}</span>
        </template>
      </Column>

      <Column field="discord_id" header="Discord">
        <template #body="{ data }">
          <span class="text-sm text-gray-600">{{ data.discord_id || '-' }}</span>
        </template>
      </Column>

      <Column v-if="showPsnColumn" field="psn_id" header="PSN ID">
        <template #body="{ data }">
          <span class="text-sm text-gray-600">{{ data.psn_id || '-' }}</span>
        </template>
      </Column>

      <Column v-if="showIracingColumn" field="iracing_id" header="iRacing ID">
        <template #body="{ data }">
          <span class="text-sm text-gray-600">{{ data.iracing_id || '-' }}</span>
        </template>
      </Column>

      <Column header="Actions" :exportable="false">
        <template #body="{ data }">
          <div class="flex gap-2">
            <ViewButton @click="handleView(data)" />
            <AddButton @click="handleAdd(data)" />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
