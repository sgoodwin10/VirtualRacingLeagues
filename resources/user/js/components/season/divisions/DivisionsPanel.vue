<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { useDivisionStore } from '@user/stores/divisionStore';
import { useSeasonDriverStore } from '@user/stores/seasonDriverStore';
import type { Division } from '@user/types/division';

import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Message from 'primevue/message';

import DivisionFormModal from './DivisionFormModal.vue';

interface Props {
  seasonId: number;
  raceDivisionsEnabled: boolean;
}

const props = defineProps<Props>();

const confirm = useConfirm();
const toast = useToast();
const divisionStore = useDivisionStore();
const seasonDriverStore = useSeasonDriverStore();

const showDivisionModal = ref(false);
const modalMode = ref<'add' | 'edit'>('add');
const selectedDivision = ref<Division | null>(null);

const divisions = computed(() => divisionStore.divisions);
const loading = computed(() => divisionStore.loading);

onMounted(async () => {
  if (props.raceDivisionsEnabled) {
    await loadDivisions();
  }
});

async function loadDivisions(): Promise<void> {
  try {
    await divisionStore.fetchDivisions(props.seasonId);
  } catch (error) {
    console.error('Failed to load divisions:', error);
  }
}

function handleAddDivision(): void {
  selectedDivision.value = null;
  modalMode.value = 'add';
  showDivisionModal.value = true;
}

function handleEditDivision(division: Division): void {
  selectedDivision.value = division;
  modalMode.value = 'edit';
  showDivisionModal.value = true;
}

function handleDeleteDivision(division: Division): void {
  // Count drivers assigned to this division
  const driversInDivision = seasonDriverStore.seasonDrivers.filter(
    (driver) => driver.division_name === division.name,
  );
  const driverCount = driversInDivision.length;

  const message =
    driverCount > 0
      ? `Delete ${division.name}? ${driverCount} driver${driverCount > 1 ? 's' : ''} will have no division.`
      : `Delete ${division.name}?`;

  confirm.require({
    message,
    header: 'Delete Division',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Delete',
    rejectLabel: 'Cancel',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await divisionStore.deleteDivision(props.seasonId, division.id);

        toast.add({
          severity: 'success',
          summary: 'Division Deleted',
          detail: `${division.name} has been deleted${driverCount > 0 ? ` and ${driverCount} driver${driverCount > 1 ? 's' : ''} now have no division` : ''}`,
          life: 3000,
        });

        // Refresh drivers to update division assignments
        await seasonDriverStore.fetchSeasonDrivers(props.seasonId);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete division';
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

function handleDivisionSaved(): void {
  loadDivisions();
}

function truncateDescription(description: string | null, maxLength: number = 30): string {
  if (!description) return '';
  return description.length > maxLength ? description.substring(0, maxLength) + '...' : description;
}
</script>

<template>
  <Button
    v-if="raceDivisionsEnabled"
    icon="pi pi-plus"
    size="small"
    label="Add Division"
    @click="handleAddDivision"
  />

  <!-- Disabled State -->
  <div v-if="!raceDivisionsEnabled" class="text-center py-8">
    <Message severity="info" :closable="false">
      <div class="flex flex-col items-center gap-2">
        <i class="pi pi-info-circle text-2xl"></i>
        <p class="font-semibold">Divisions not enabled for this season</p>
        <p class="text-sm">Enable race divisions in season settings to manage divisions</p>
      </div>
    </Message>
  </div>

  <!-- Enabled State -->
  <div v-else>
    <DataTable
      :value="divisions"
      :loading="loading"
      striped-rows
      show-gridlines
      responsive-layout="scroll"
      class="text-sm"
    >
      <template #empty>
        <div class="text-center py-6">
          <i class="pi pi-trophy text-3xl text-gray-400 mb-2"></i>
          <p class="text-gray-600">No divisions created yet</p>
          <p class="text-sm text-gray-500 mt-1">
            Click "Add Division" to create your first division
          </p>
        </div>
      </template>

      <template #loading>
        <div class="text-center py-6 text-gray-500">Loading divisions...</div>
      </template>

      <Column field="name" header="Division">
        <template #body="{ data }">
          <div class="flex items-start gap-2">
            <img
              v-if="data.logo_url"
              :src="data.logo_url"
              :alt="data.name"
              class="w-8 h-8 rounded object-cover flex-shrink-0"
            />
            <div class="flex-1 min-w-0">
              <p class="font-semibold">{{ data.name }}</p>
              <p v-if="data.description" class="text-xs text-gray-500 mt-1 truncate">
                {{ truncateDescription(data.description, 50) }}
              </p>
            </div>
          </div>
        </template>
      </Column>

      <Column header="Actions" :exportable="false" style="width: 8rem">
        <template #body="{ data }">
          <div class="flex gap-1">
            <Button
              icon="pi pi-pencil"
              size="small"
              outlined
              severity="secondary"
              @click="handleEditDivision(data)"
            />
            <Button
              icon="pi pi-trash"
              size="small"
              outlined
              severity="danger"
              @click="handleDeleteDivision(data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>
  </div>

  <!-- Division Form Modal -->
  <DivisionFormModal
    v-model:visible="showDivisionModal"
    :mode="modalMode"
    :season-id="seasonId"
    :division="selectedDivision"
    @save="handleDivisionSaved"
  />
</template>
