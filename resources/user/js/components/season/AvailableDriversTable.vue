<script setup lang="ts">
import { computed } from 'vue';
import { useSeasonDriverStore } from '@user/stores/seasonDriverStore';
import type { AvailableDriver } from '@user/types/seasonDriver';
import { usesPsnId, usesIracingId } from '@user/constants/platforms';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';

interface Props {
  loading?: boolean;
  platformId?: number;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  platformId: undefined,
});

interface Emits {
  (e: 'view', driver: AvailableDriver): void;
  (e: 'add', driver: AvailableDriver): void;
}

const emit = defineEmits<Emits>();

const seasonDriverStore = useSeasonDriverStore();

const availableDrivers = computed(() => seasonDriverStore.availableDrivers);

const showPsnColumn = computed(() => {
  const result = usesPsnId(props.platformId);
  console.log('[AvailableDriversTable] PSN Column Visibility:', {
    platformId: props.platformId,
    showPsnColumn: result,
  });
  return result;
});

const showIracingColumn = computed(() => {
  const result = usesIracingId(props.platformId);
  console.log('[AvailableDriversTable] iRacing Column Visibility:', {
    platformId: props.platformId,
    showIracingColumn: result,
  });
  return result;
});

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
</script>

<template>
  <div class="available-drivers-table">
    <DataTable
      :value="availableDrivers"
      :loading="loading"
      paginator
      :rows="10"
      :rows-per-page-options="[10, 25, 50]"
      striped-rows
      show-gridlines
      responsive-layout="scroll"
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
            <Button icon="pi pi-eye" size="small" outlined @click="handleView(data)" />
            <Button icon="pi pi-plus" size="small" @click="handleAdd(data)" />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
