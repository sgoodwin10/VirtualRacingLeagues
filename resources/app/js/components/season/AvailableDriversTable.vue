<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useSeasonDriverStore } from '@app/stores/seasonDriverStore';
import type { AvailableDriver } from '@app/types/seasonDriver';
import { usesPsnId, usesIracingId } from '@app/constants/platforms';

import type { DataTablePageEvent } from 'primevue/datatable';
import Column from 'primevue/column';
import { Button } from '@app/components/common/buttons';
import { TechDataTable, DriverCell } from '@app/components/common/tables';
import { createLogger } from '@app/utils/logger';
import { ROWS_PER_PAGE_OPTIONS } from '@app/constants/pagination';
import {
  PhEye,
  PhPlus,
  PhCaretDoubleLeft,
  PhCaretLeft,
  PhCaretRight,
  PhCaretDoubleRight,
} from '@phosphor-icons/vue';

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
    <TechDataTable
      :value="availableDrivers"
      :loading="loading"
      lazy
      paginator
      :rows="25"
      :rows-per-page-options="ROWS_PER_PAGE_OPTIONS"
      :total-records="totalRecords"
      :first="first"
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

      <template #paginatorcontainer="{ page, pageCount, prevPageCallback, nextPageCallback }">
        <div class="flex items-center justify-end w-full px-4 py-2">
          <div class="flex items-center gap-1">
            <Button
              :icon="PhCaretDoubleLeft"
              variant="outline"
              size="sm"
              :disabled="(page ?? 0) === 0"
              aria-label="First page"
              @click="
                handlePageChange({
                  page: 0,
                  rows: 25,
                  first: 0,
                  pageCount: pageCount ?? 0,
                } as DataTablePageEvent)
              "
            />
            <Button
              :icon="PhCaretLeft"
              variant="outline"
              size="sm"
              :disabled="(page ?? 0) === 0"
              aria-label="Previous page"
              @click="prevPageCallback"
            />
            <span class="text-sm text-gray-600 mx-2">
              Page {{ (page ?? 0) + 1 }} of {{ pageCount ?? 0 }}
            </span>
            <Button
              :icon="PhCaretRight"
              variant="outline"
              size="sm"
              :disabled="(page ?? 0) === (pageCount ?? 1) - 1"
              aria-label="Next page"
              @click="nextPageCallback"
            />
            <Button
              :icon="PhCaretDoubleRight"
              variant="outline"
              size="sm"
              :disabled="(page ?? 0) === (pageCount ?? 1) - 1"
              aria-label="Last page"
              @click="
                handlePageChange({
                  page: (pageCount ?? 1) - 1,
                  rows: 25,
                  first: ((pageCount ?? 1) - 1) * 25,
                  pageCount: pageCount ?? 0,
                } as DataTablePageEvent)
              "
            />
          </div>
        </div>
      </template>

      <Column field="driver_name" header="Driver">
        <template #body="{ data }">
          <DriverCell :name="getDriverDisplayName(data)" :show-avatar="false" />
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
            <Button
              :icon="PhEye"
              size="sm"
              variant="outline"
              aria-label="View driver"
              @click="handleView(data)"
            />
            <Button
              :icon="PhPlus"
              size="sm"
              variant="success"
              aria-label="Add driver"
              @click="handleAdd(data)"
            />
          </div>
        </template>
      </Column>
    </TechDataTable>
  </div>
</template>
