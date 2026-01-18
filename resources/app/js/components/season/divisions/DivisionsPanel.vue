<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import { useDivisionStore } from '@app/stores/divisionStore';
import { useSeasonDriverStore } from '@app/stores/seasonDriverStore';
import type { Division } from '@app/types/division';

import type { DataTableRowReorderEvent } from 'primevue/datatable';
import Column from 'primevue/column';
import { Button, FooterAddButton } from '@app/components/common/buttons';
import Message from 'primevue/message';
import { PhPencil, PhTrash, PhTrophy } from '@phosphor-icons/vue';

import { TechDataTable } from '@app/components/common/tables';
import DivisionFormModal from './DivisionFormModal.vue';
import ResponsiveImage from '@app/components/common/ResponsiveImage.vue';
import { CardHeader } from '@app/components/common/cards';

interface Props {
  seasonId: number;
  raceDivisionsEnabled: boolean;
  isSeasonCompleted?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isSeasonCompleted: false,
});

const confirm = useConfirm();
const toast = useToast();
const divisionStore = useDivisionStore();
const seasonDriverStore = useSeasonDriverStore();

const showDivisionModal = ref(false);
const modalMode = ref<'add' | 'edit'>('add');
const selectedDivision = ref<Division | null>(null);
const isReordering = ref(false);

const divisions = computed(() => divisionStore.sortedDivisions);
const loading = computed(() => divisionStore.loading);

onMounted(async () => {
  if (props.raceDivisionsEnabled) {
    await loadDivisions();
  }
});

// Watch for seasonId changes to reload data when navigating between seasons
watch(
  () => props.seasonId,
  async (newSeasonId, oldSeasonId) => {
    if (newSeasonId && newSeasonId !== oldSeasonId && props.raceDivisionsEnabled) {
      await loadDivisions();
    }
  },
);

async function loadDivisions(): Promise<void> {
  try {
    await divisionStore.fetchDivisions(props.seasonId);
  } catch {
    // Error handling happens in the store
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
    (driver) => driver.division_id === division.id,
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

async function handleRowReorder(event: DataTableRowReorderEvent): Promise<void> {
  // Guard against empty or invalid reorder event
  if (!event.value || event.value.length === 0) {
    return;
  }

  isReordering.value = true;
  try {
    // Create a defensive copy of the event data to avoid mutating DataTable's internal state
    // PrimeVue's DataTableRowReorderEvent.value contains the reordered array of divisions
    const reorderedDivisions = [...event.value] as Division[];

    // Build new order array from reordered rows
    const newOrder = reorderedDivisions.map((division: Division, index: number) => ({
      id: division.id,
      order: index + 1, // 1-based ordering
    }));

    await divisionStore.reorderDivisions(props.seasonId, newOrder);

    toast.add({
      severity: 'success',
      summary: 'Order Updated',
      detail: 'Division order has been updated successfully',
      life: 3000,
    });
  } catch (error: unknown) {
    // Extract error message from Axios response if available
    let errorMessage = 'Failed to update division order';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    // Check for Axios error with response
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      if (axiosError.response?.data?.message) {
        errorMessage = axiosError.response.data.message;
      }
    }
    toast.add({
      severity: 'error',
      summary: 'Reorder Failed',
      detail: errorMessage,
      life: 5000,
    });
  } finally {
    isReordering.value = false;
  }
}

function truncateDescription(description: string | null, maxLength: number = 30): string {
  if (!description) return '';
  return description.length > maxLength ? description.substring(0, maxLength) + '...' : description;
}
</script>

<template>
  <div>
    <!-- Disabled State -->
    <div v-if="!raceDivisionsEnabled" class="text-center py-6">
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
      <!-- Header Row -->
      <div class="mb-3 hidden">
        <span class="text-sm text-gray-600">
          {{ divisions.length }} division{{ divisions.length !== 1 ? 's' : '' }}
        </span>
      </div>

      <!-- DataTable -->
      <TechDataTable
        :value="divisions"
        :loading="loading || isReordering"
        :reorderable-rows="!isReordering && !props.isSeasonCompleted"
        responsive-layout="scroll"
        class="text-sm"
        @row-reorder="handleRowReorder"
      >
        <template #empty>
          <div class="text-center py-8">
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

        <template #header>
          <CardHeader title="Divisions" :icon="PhTrophy" icon-color="blue-300" />
        </template>

        <!-- Drag Handle Column -->
        <Column :row-reorder="true" header-style="width: 3rem" :reorderable-column="false" />

        <Column field="name" header="Division">
          <template #body="{ data }">
            <div class="flex items-start gap-2">
              <ResponsiveImage
                v-if="data.logo || data.logo_url"
                :media="data.logo"
                :fallback-url="data.logo_url ?? undefined"
                :alt="data.name"
                sizes="32px"
                conversion="thumb"
                img-class="w-8 h-8 rounded object-cover flex-shrink-0"
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

        <Column
          v-if="!props.isSeasonCompleted"
          header="Actions"
          :exportable="false"
          style="width: 8rem"
        >
          <template #body="{ data }">
            <div class="flex gap-1">
              <Button
                :icon="PhPencil"
                size="sm"
                variant="outline"
                :disabled="isReordering"
                @click="handleEditDivision(data)"
              />
              <Button
                :icon="PhTrash"
                size="sm"
                variant="danger"
                :disabled="isReordering"
                @click="handleDeleteDivision(data)"
              />
            </div>
          </template>
        </Column>
      </TechDataTable>

      <!-- Add Division Button (footer, hidden for completed seasons) -->
      <FooterAddButton
        v-if="raceDivisionsEnabled && !props.isSeasonCompleted"
        label="Add Division"
        @click="handleAddDivision"
      />
    </div>

    <!-- Division Form Modal -->
    <DivisionFormModal
      v-model:visible="showDivisionModal"
      :mode="modalMode"
      :season-id="seasonId"
      :division="selectedDivision"
      @save="handleDivisionSaved"
    />
  </div>
</template>
