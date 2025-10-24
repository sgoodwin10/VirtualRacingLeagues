<script setup lang="ts">
import { computed } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { useSeasonDriverStore } from '@user/stores/seasonDriverStore';
import type { SeasonDriver } from '@user/types/seasonDriver';
import { usesPsnId, usesIracingId } from '@user/constants/platforms';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import ConfirmDialog from 'primevue/confirmdialog';

interface Props {
  seasonId: number;
  loading?: boolean;
  platformId?: number;
  showNumberColumn?: boolean;
  showTeamColumn?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  platformId: undefined,
  showNumberColumn: true,
  showTeamColumn: true,
});

interface Emits {
  (e: 'view', driver: SeasonDriver): void;
}

const emit = defineEmits<Emits>();

const confirm = useConfirm();
const toast = useToast();
const seasonDriverStore = useSeasonDriverStore();

const drivers = computed(() => seasonDriverStore.seasonDrivers);

const showPsnColumn = computed(() => {
  const result = usesPsnId(props.platformId);
  console.log('[SeasonDriversTable] PSN Column Visibility:', {
    platformId: props.platformId,
    showPsnColumn: result,
  });
  return result;
});

const showIracingColumn = computed(() => {
  const result = usesIracingId(props.platformId);
  console.log('[SeasonDriversTable] iRacing Column Visibility:', {
    platformId: props.platformId,
    showIracingColumn: result,
  });
  return result;
});

function getDriverDisplayName(driver: SeasonDriver): string {
  const { first_name, last_name, nickname } = driver;

  if (first_name && last_name) {
    return `${first_name} ${last_name}`;
  }

  return nickname || 'Unknown Driver';
}

function handleView(driver: SeasonDriver): void {
  emit('view', driver);
}

function handleRemove(driver: SeasonDriver): void {
  const driverName = getDriverDisplayName(driver);

  confirm.require({
    message: `Remove ${driverName} from this season?`,
    header: 'Remove Driver',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Remove',
    rejectLabel: 'Cancel',
    accept: async () => {
      try {
        await seasonDriverStore.removeDriver(props.seasonId, driver.id);

        toast.add({
          severity: 'success',
          summary: 'Driver Removed',
          detail: 'Driver has been removed from the season',
          life: 3000,
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to remove driver';
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: errorMessage,
          life: 5000,
        });
      }
    },
  });
}
</script>

<template>
  <div class="season-drivers-table">
    <DataTable
      :value="drivers"
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
          <i class="pi pi-users text-4xl text-gray-400 mb-3"></i>
          <p class="text-gray-600">No drivers assigned to this season yet.</p>
        </div>
      </template>

      <template #loading>
        <div class="text-center py-8 text-gray-500">Loading season drivers...</div>
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

      <Column v-if="showNumberColumn" field="driver_number" header="Number">
        <template #body="{ data }">
          <span class="text-sm text-gray-600">{{ data.driver_number || '-' }}</span>
        </template>
      </Column>

      <Column v-if="showTeamColumn" field="team_name" header="Team">
        <template #body="{ data }">
          <span class="text-sm text-gray-600">{{ data.team_name || '-' }}</span>
        </template>
      </Column>

      <Column header="Actions" :exportable="false">
        <template #body="{ data }">
          <div class="flex gap-2">
            <Button icon="pi pi-eye" size="small" outlined @click="handleView(data)" />
            <Button
              icon="pi pi-trash"
              size="small"
              severity="danger"
              outlined
              @click="handleRemove(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <ConfirmDialog />
  </div>
</template>
